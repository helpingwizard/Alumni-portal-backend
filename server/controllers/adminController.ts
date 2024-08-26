import { Request, Response, query } from "express";
import { generateAdminToken } from "../middleware/adminMiddleware";
import { client } from "../model/db";
import { ReqMid } from "../types/admin";
import jwt from "jsonwebtoken";
import { generateUserToken } from "../middleware/userMiddleware";
import bcrypt from "bcryptjs";
import { QueryResult } from "pg";
const _ = require('lodash');

const SignAdminUp = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Fill all the fields" });
    }

    // Check for existing admin with the same email or username
    const checkQuery = `
      SELECT * FROM admin_table WHERE email = $1 OR username = $2
    `;
    const checkParams = [email, username];
    const checkResult = await client.query(checkQuery, checkParams);

    if (checkResult.rows.length > 0) {
      const existingUser = checkResult.rows[0];
      if (existingUser.email === email) {
        return res.status(409).json({ error: "Admin with this email already exists." });
      }
      if (existingUser.username === username) {
        return res.status(409).json({ error: "Username taken" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO admin_table (username, email, admin_password, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW()) RETURNING admin_id, username, email, created_at
    `;
    const params = [username, email, hashedPassword];

    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      throw new Error("Failed to create admin");
    }

    const admin = result.rows[0];
    const token = await generateAdminToken(admin.id);

    // Fetch the newly created admin without the password for response
    const fetchAdminQuery = `SELECT * FROM admin_table WHERE admin_id = $1`;
    const adminData = await client.query(fetchAdminQuery, [admin.admin_id]);
    const adminWithoutPassword = _.omit(adminData.rows[0], 'admin_password');

    res.status(201).json({ message: "Successfully signed up", token, admin: adminWithoutPassword });
  } catch (err: any) {
    // Handle errors that occurred during the database operation
    console.error("Error during admin signup:", err);

    const duplicateError = err.message.split(" ").pop().replaceAll('"', "");

    if (duplicateError === "admin_table_email_key") {
      res.status(409).json({ error: "Admin with this email already exists." });
    } else if (duplicateError === "admin_table_username_key") {
      res.status(409).json({ error: "Username taken" });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};
const SignAdminIn = async (req: Request, res: Response) => {
  try {
    const userName: string = req.body.username;
    const password: string = req.body.password;
    const success: Boolean = true;
    if (!userName || !password) {
      res.status(400).json({ status: false, message: "Fill all the fields" });
    } else {
      const text = `SELECT * FROM admin_table WHERE username = '${userName}';`;
      
      const data: QueryResult<any> = await client.query(text);
      
      if (data.rowCount === 1) {
        const auth = await bcrypt.compare(
          password,
          data.rows[0].admin_password
        );
        if (auth) {
          const token = await generateAdminToken(data.rows[0].admin_id); // when finish the middleware uncomment this.
          const admin = data.rows[0];
          delete admin.admin_password;
          return res.status(200).json({
            status: true,
            token: token,
            admin: admin,
            message: "Admin Signed In",
          });
        } else {
          return res
            .status(400)
            .json({ status: false, message: "Invalid Password" });
        }
      } else {
        return res
          .status(400)
          .json({ status: false, message: "Admin Not Found" });
      }
    }
  } catch (err: any) {
    res.status(400).json({ status: false, message: err.message });
  }
};

const AlumniVerificationInfo = async (req: Request, res: Response) => {
  try {
    const query = `SELECT DISTINCT users.*, user_profile.*
FROM users
JOIN user_profile ON users.user_id = user_profile.fk_user
WHERE users.is_verified = false AND users.is_alumni = true;
`;
    const data = await client.query(query);
    if (data.rows.length < 1) {
      return res.status(404).json({
        status: false,
        message: "No records found in alumni verification",
      });
    }

    const alumniData = data.rows;

    for (let i = 0; i < alumniData.length; i++) {
      delete alumniData[i].user_password;
      delete alumniData[i].otp;
    }


    res.status(200).json({
      status: true,
      data: alumniData,
      message: "Alumni verification records retrieved",
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

const AlumniVerification = async (req: Request, res: Response) => {
  try {

    const { user_id } = req.body;
    const currentYear = new Date().getFullYear();

    

    const alumniQuery = `SELECT * FROM users WHERE users.user_id = $1 AND is_verified = false AND is_alumni = true`;
    const alumniParams = [user_id];
    const alumniData = await client.query(alumniQuery, alumniParams);

    

    if (alumniData.rowCount === null || alumniData.rowCount === 0) {
      return res
        .status(400)
        .json({ status: false, message: "Unable to find user" });
    }

    if (alumniData.rows[0].passout_year <= currentYear) {
      // Update is_alumni status in the database
      const verified = await client.query(
        `UPDATE users SET is_verified = true WHERE user_id = $1 RETURNING *`,
        [user_id]
      );

      // Update the is_alumni status in the retrieved data
      delete verified.rows[0].user_password;
      delete verified.rows[0].otp;

      const deleteQuery = 'DELETE FROM user_token WHERE fk_user = $1';
      await client.query(deleteQuery, [user_id]);

      return res.status(201).json({
        status: true,
        data: verified.rows[0],
        message: "User verified as Alumni",
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "User is not eligible for alumni status",
      });

      
    }

    
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};


const AdminLogout = async (req: ReqMid, res: Response) => {
  if (!req.token) {
    return res.status(401).json({ error: "You are already logged out" });
  }

  const removeAdmin: string = "DELETE FROM admin_token WHERE token = $1";

  const value: any[] = [req.token];

  try {
    const result: QueryResult<any> = await client.query(removeAdmin, value);

    return res.status(200).json({ status: true, message: "Admin logged out successfully!" });
  } catch (err: any) {
    return res
      .status(500)
      .json({ status: false, message: "An error occurred while logging out" });
  }
};

const getUsers = async (req: Request, res: Response) => {
  const getQuery = `SELECT * FROM user_profile`;

  try {
    const result = await client.query(getQuery);
    res.status(200).json(result.rows);
  } catch (err: any) {
    res.status(400).json(err.message);
  }
};

const getCount = async (req: Request, res: Response) => {
  try {
    const countOfUsersQuery = `SELECT COUNT(*) userCount FROM user_profile`;
    const countOfPostsQuery = `SELECT COUNT(*) postCount FROM posts`;
    const countOfAlumnisQuery = `SELECT COUNT(*) alumniCount FROM users WHERE is_alumni = true`;
    const countOfVerifiedAlumnisQuery = `SELECT COUNT(*) verifiedAlumniCount FROM users WHERE is_alumni = true AND is_verified = true`;


    const countOfUsers: QueryResult<{ usercount: number }> = await client.query(
      countOfUsersQuery
    );
    const countOfPosts: QueryResult<{ postcount: number }> = await client.query(
      countOfPostsQuery
    );
    const countOfAlumnis: QueryResult<{ alumnicount: number }> = await client.query(
      countOfAlumnisQuery
    );
    const countOfVerifiedAlumnis: QueryResult<{ verifiedalumnicount: number }> = await client.query(
      countOfVerifiedAlumnisQuery
    );

    const userCount = countOfUsers.rows[0].usercount;
    const postCount = countOfPosts.rows[0].postcount;
    const alumniCount = countOfAlumnis.rows[0].alumnicount;
    const verifiedAlumniCount = countOfVerifiedAlumnis.rows[0].verifiedalumnicount;
    const unverifiedAlumniCount = alumniCount - verifiedAlumniCount;

    res.status(200).json({
      status: true,
      message: "Retrived count of users",
      data: { "users": userCount, "posts": postCount, "verifiedAlumnis": verifiedAlumniCount, "alumnis": alumniCount, "unverifiedAlumnis": unverifiedAlumniCount },
    });
  } catch (err) {
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;

    const deleteQuery = `DELETE FROM users WHERE user_id = $1 `;

    const values = [user_id];

    const result = await client.query(deleteQuery, values);
    

    res
      .status(200)
      .json({ status: true, message: "User deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ status: false, message: "Error deleting user" });
  }
};

const getReports = async (req: Request, res: Response) => {
  try {
    const result = await client.query("SELECT * FROM reports");
    if (!result || result.rows.length === 0) {
      return res.status(404).send({ status: false, message: "Reports not found." });
    }
    // Log the retrieved reports
    return res.status(200).json({ status: true, data: result.rows, message: "Fetched all reports" }); // Send the retrieved reports in the response
  } catch (error) {
    console.error("Error in getting reports:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

const deletePost = async (req: Request, res: Response) => {
  try {
    const post_id = req.params.id;
    if (!post_id) {
      return res.status(400).json({ status: false, message: "post id is required" })
    }
    //retriving post
    const postQuery = `SELECT * FROM posts WHERE posts_id=$1`;
    const postParams = [post_id];
    const post = await client.query(postQuery, postParams);


    //deleting post
    const deleteQuery = "DELETE FROM posts WHERE posts_id=$1";
    const params = [post_id];
    const result = await client.query(deleteQuery, params);

    if (post.rows.length == 0) {
      return res.status(404).json({ status: false, message: "Post not found" });
    }
    
    res.status(200).json({ status: true, data: post.rows, message: "Post deleted Successfully" })
  }
  catch (err) {
    res.status(500).json({ status: false, message: "Internal server error" })
  }
};


const makeAlumni = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;

    const makeAlumniQuery = `UPDATE users SET is_alumni = true WHERE user_id = $1`;

    const values = [user_id];



    const result = await client.query(makeAlumniQuery, values);

    res
      .status(200)
      .json({ status: true, message: "User is now an alumni" });
  } catch (err: any) {
    res.status(500).json({ status: false, message: "Error making user an alumni" });
  }
}

const getAlumnis = async (req: Request, res: Response) => {
  try {
    const getAlumniQuery = `SELECT * FROM users WHERE is_alumni = true`;

    const result = await client.query(getAlumniQuery);

    res.status(200).json(result.rows);
  } catch (err: any) {
    res.status(500).json(err.message);
  }
}



const getChartData = async (req: Request, res: Response) => {
  try {
    //get last week wise data

    const getWeeksPostQuery = `
    SELECT COUNT(*) AS count, date_trunc('day', created_at) AS day
FROM posts 
WHERE created_at >= current_date - interval '6 days'
GROUP BY day
ORDER BY day;
  `;

    const getWeeksUserQuery = `
    SELECT COUNT(*) AS count, date_trunc('day', created_at) AS day
FROM users 
WHERE is_alumni = false 
AND created_at >= current_date - interval '6 days'
GROUP BY day
ORDER BY day;`;

    const getWeeksAlumniQuery = `
    SELECT COUNT(*) AS count, date_trunc('day', created_at) AS day
FROM users 
WHERE is_alumni = true 
AND created_at >= current_date - interval '6 days'
GROUP BY day
ORDER BY day;`;

    const posts = await client.query(getWeeksPostQuery);
    const users = await client.query(getWeeksUserQuery);
    const alumnis = await client.query(getWeeksAlumniQuery);

    res.status(200).json({
      status: true,
      data: {
        posts: posts.rows,
        users: users.rows,
        alumnis: alumnis.rows
      },
      message: "Chart data retrieved successfully",
    });



  } catch (err: any) {
    res.status(500).json(err.message);
  }
}

const getALLFeedbacks = async (req: Request, res: Response) => {
  try {
    const type = parseInt(req.params.type, 10);
    let getFeedBackQuery = `SELECT fd.feedback_id, fd.content, fd.stars, u.first_name, u.last_name, u.phone, u.email, u.is_alumni,u.is_verified,up.profile_image, up.git_profile, up.linkedin, up.portfolio FROM feedback fd JOIN user_profile up ON fd.fk_user = up.profile_id JOIN users u ON up.fk_user = u.user_id`;

    if (type === 1) {
      getFeedBackQuery += ` WHERE u.is_verified = false`;
    } else if (type === 2) {
      getFeedBackQuery += ` WHERE u.is_verified = true`;
    }

    const result = await client.query(getFeedBackQuery);
    return res.status(200).json({
      status: true,
      feedbacks: result.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}



const deleteFeedback = async (req: Request, res: Response) => {
  try {
    const { feedback_id } = req.body;

    const deleteQuery = `DELETE FROM feedback WHERE feedback_id = $1`;

    const values = [feedback_id];

    const result = await client.query(deleteQuery, values);

    res
      .status(200)
      .json({ status: true, message: "Feedback deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ status: false, message: "Error deleting feedback" });
  }
}

const AddNews = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const insertQuery = `INSERT INTO announcements (content) VALUES ($1)`;
    const values = [content];

    await client.query(insertQuery, values);

    res.status(200).json({ status: true, message: "News added successfully!" });
  } catch (error) {
    console.error('Error adding news:', error);
    res.status(500).json({ status: false, message: "Error in adding news" });
  }
};

const DeleteNews = async (req: Request, res: Response) => {
      try {
        const {id}=req.body;
        const deleteQuery='DELETE FROM announcements where id=$1';
        const values=[id];
        await client.query(deleteQuery,values);
        res.status(200).json({ status: true, message: "News deleted successfully" });
      } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Error deleting feedback" });
      }
};

const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const selectQuery ="select * from announcements";
    const result = await client.query(selectQuery);

    res.status(200).json( result.rows );
  } catch (error) {

    res.status(500).json({ status: false, message: "Error in fetching news" });
  }
};

module.exports = {
  SignAdminIn,
  SignAdminUp,
  AdminLogout,
  AlumniVerification,
  AlumniVerificationInfo,
  getUsers,
  getCount,
  deleteUser,
  deletePost,
  getReports,
  makeAlumni,
  getAlumnis,
  getChartData,
  getALLFeedbacks,
  deleteFeedback,
  AddNews,
  DeleteNews,
  getAnnouncements
};
