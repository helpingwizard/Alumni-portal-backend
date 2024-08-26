import express, { Request, Response, RequestHandler } from "express";
import { QueryResult } from "pg";
import { ReqMid } from "../types/user";
import { ReqPost, ReqUtil } from "../types/user";
import { bool } from "aws-sdk/clients/signer";

const { client } = require("../model/db.ts");

export const createLike = async (req: ReqUtil, res: Response) => {
  try {
    const user_id = req.isUserHasProfile.profile_id
    const { post_id } = req.body;
    const checkIfLiked = 'SELECT * FROM likes WHERE user_id = $1 AND post_id = $2';
    const checkValues = [user_id, post_id];
    const checkResponse = await client.query(checkIfLiked, checkValues);
    if (checkResponse.rowCount > 0) {
      return res.status(400).json({ message: "Post already liked" });
    }
    const likeQuery = 'INSERT INTO likes(post_id, user_id)VALUES ($1,$2);';
    const values = [post_id, user_id];
    const result = await client.query(likeQuery, values);
    const response: any = await client.query(
      "UPDATE posts SET likes = (SELECT COUNT(*) FROM likes WHERE post_id = $1) WHERE posts_id = $1",[post_id]
    );  
    res.status(200).json({ message: "post liked" });
  } catch (error) {
    console.error("Error creating like:", error);
    res.status(500).send("Error creating like");
  }
}
exports.getNews = async (req: Request, res: Response) => {
  try {
    const selectQuery ="select * from announcements";
    const result = await client.query(selectQuery);

    res.status(200).json( result.rows );
  } catch (error) {

    res.status(500).json({ status: false, message: "Error in fetching news" });
  }
};

export const deleteLike = async (req: ReqUtil, res: Response) => {
  try {
    const user_id = req.isUserHasProfile.profile_id;
    const { post_id } = req.body;

    // Check if the user has liked this post
    const numberOfLikesQuery = 'SELECT * FROM likes WHERE user_id = $1 AND post_id = $2';
    const numberOfLikes = await client.query(numberOfLikesQuery, [user_id, post_id]);

    if (numberOfLikes.rowCount === 0) {
      return res.status(400).json({ msg: "You cannot unlike. No like found." });
    }

    // Delete the like
    const deleteLikeQuery = 'DELETE FROM likes WHERE user_id = $1 AND post_id = $2';
    await client.query(deleteLikeQuery, [user_id, post_id]);

    // Update the post's like count
    const updatePostLikesQuery = 'UPDATE posts SET likes = (SELECT COUNT(*) FROM likes WHERE post_id = $1) WHERE posts_id = $1';
    await client.query(updatePostLikesQuery, [post_id]);

    res.status(200).json({ message: "Like removed" });
  } catch (error) {
    console.error("Error deleting like:", error);
    res.status(500).send("Error deleting like");
  }
}

export const getPostsByProfile = async (req: ReqMid, res: Response) => {
  try {

    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: "Invalid user profile ID" });
    }

    const getPostsQuery = `SELECT p.*,u.first_name, u.last_name FROM posts p JOIN user_profile up ON p.fk_user = up.profile_id JOIN users u ON u.user_id = up.fk_user where up.profile_id = $1`;
    const getPostsValue = [id];
    const { rows } = await client.query(getPostsQuery, getPostsValue);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No posts found for the user profile ID" });
    }

    return res.json(rows);
  } catch (error) {
    console.error("Error retrieving posts:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}




export const getAllPosts = async (req: ReqUtil, res: Response) => {
  try {
    if (req.isUserHasProfile) {
      const user_id = req.isUserHasProfile.profile_id;
      //console.log("profile_id from getPosts: ", user_id);

      // Get page and limit from query parameters with default values
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const offset = (page - 1) * limit;

      const query = `
            SELECT
          p.posts_id,
          p.fk_user,
          p.fk_domain_id,
          p.title,
          p.content,
          GREATEST(p.likes, 0) AS likes,
          p.link,
          p.created_at,
          CASE WHEN l.user_id IS NULL THEN false ELSE true END AS liked,
          CASE WHEN b.user_id IS NULL THEN false ELSE true END AS bookmarked,
          up.profile_image,
          u.first_name,
          u.last_name
      FROM
          posts p
      LEFT JOIN
          likes l ON p.posts_id = l.post_id AND l.user_id = $1
      LEFT JOIN
          bookmarks b ON p.posts_id = b.post_id AND b.user_id = $1
      LEFT JOIN
          user_profile up ON p.fk_user = up.profile_id
      LEFT JOIN
          users u ON up.fk_user = u.user_id
      ORDER BY
          p.created_at DESC
      LIMIT $2 OFFSET $3;
    `;

      const { rows } = await client.query(query, [user_id, limit, offset]);
      return res.json(rows);

    } else {
      return res.status(400).json({ msg: "User has not created the profile" });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};



export const deletePost = async (req: ReqUtil, res: Response) => {
  const user_id = req.isUserHasProfile.profile_id;
  const { post_id } = req.body;

  if (!post_id) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  const deleteLikesQuery = 'DELETE FROM likes WHERE post_id = $1';
  await client.query(deleteLikesQuery, [post_id]);

  const deleteBookmarkQuery = 'DELETE FROM bookmarks WHERE post_id = $1'
  await client.query(deleteBookmarkQuery, [post_id]);

  const deletePostQuery = 'DELETE FROM posts WHERE posts_id = $1 AND fk_user = $2';
  try {
    const result = await client.query(deletePostQuery, [post_id, user_id]);
    if (result.rowCount === 1) {
      res.status(200).json({ message: 'Post deleted successfully' });
    } else {
      res.status(404).json({ message: 'Post not found or you are not authorized to delete it' });
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



export const getPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    //console.log(id);
    const response = await client.query(
      `SELECT
          p.*,
          up.profile_image,
          u.first_name,
          u.last_name
      FROM
          posts p
      LEFT JOIN
          user_profile up ON p.fk_user = up.profile_id
      LEFT JOIN
          users u ON up.fk_user = u.user_id
      WHERE
          p.posts_id = $1
      ORDER BY
          p.created_at DESC`,
      [id]
    );
    res.status(200).json(response.rows);
  } catch (err: any) {
    console.error('Error fetching post:', err);
    return res.status(500).send('Error fetching post');
  }
};


export const createPost = async (req: ReqPost, res: Response) => {
  try {
    const profile_id: number = req.isUserHasProfile.profile_id;

    const getfk_userQuery  = 'SELECT fk_user FROM user_profile WHERE profile_id = $1';
    const result = await client.query(getfk_userQuery, [profile_id]);
    const fk_user: number = result.rows[0].fk_user;
    
    const checkIfAlumniQuery = `SELECT is_alumni, is_verified FROM users WHERE users.user_id = $1;`
    const user_id = [fk_user]
    const checkIfAlumni = await client.query(checkIfAlumniQuery, user_id);

    if (checkIfAlumni.rows[0].is_alumni === false || checkIfAlumni.rows[0].is_verified === false) {
      return res.status(403).json({ message: "Only verified alumni can post" });
    }

    const {

      fk_domain_id,
      title,
      content,
      link
    } = req.body;

    let query = `INSERT INTO posts (fk_user, fk_domain_id, title, content, likes, link, created_at) VALUES($1, $2, $3, $4, $5, $6, $7)`;
    const params = [
      profile_id,
      fk_domain_id,
      title,
      content,
      0,
      link,
      new Date()
    ]
    const response = await client.query(query, params)
    // console.log(response);
    res.status(200).send({ message: 'Post Created' })
  } catch (err: any) {
    console.log(err)
    res.status(401).send(err)
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { flag } = req.body;
    if (flag) {
      const { title, content } = req.body;
      const response: any = await client.query(
        "UPDATE posts SET title = $2, content = $3 WHERE posts_id = $1",
        [id, title, content]
      );
      res.status(200).json({ message: "Post updated successfully!" });
    } else {
      const { count } = req.body;
      const response: any = await client.query(
        "UPDATE posts SET likes = likes + $2 WHERE posts_id = $1",
        [id, count]
      );
      res.status(200).json({ message: "Post updated successfully!" });
    }
  } catch (err) {
    console.error(err);
    res.status(401).json(err);
  }
};
export const showBookmark = async (req: Request, res: Response) => {
  try {
    const { profile_id } = req.body;
    const query: string = "select p.*,CASE WHEN l.userId is NULL then false Else true END as liked from posts  as p left join likes as l on p.posts_id = l.postId where post_id = (select fk_post from  bookmark_post where fk_user = $1) ";
    let results: QueryResult = client.query(query, [profile_id]);
    return res.status(201).json(results.rows);
  }
  catch (e) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

interface ReqBook extends ReqMid {
  body: {
    posts_id: Number,
    action: boolean
  }
}
export const bookmarkPost = async (req: ReqBook, res: Response) => {
  //console.log(req)

  const { posts_id, action } = req.body;
  const profile_id = req.isUserHasProfile.profile_id;
  try {
    if (action) {
      const bookmarkEntryQuery = `INSERT INTO bookmarks(user_id, post_id) VALUES($1, $2)`;
      const value = [profile_id, posts_id];
      const status = await client.query(bookmarkEntryQuery, value);
      res.status(200).send("Bookmarked");
      //write query for bookmark post
    } else {
      //write query for un-bookmark
      const bookmarkDeleteQuery = `DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2`;
      const value = [profile_id, posts_id];
      const status = await client.query(bookmarkDeleteQuery, value);
      res.status(200).send("Un-Bookmarked");
    }
  }
  catch (error) {
    console.log(error);
    res.status(500).send(error);
  }

};

export const getBookmarkPosts = async (req: ReqMid, res: Response) => {
  try {
    const profile_id = req.isUserHasProfile.profile_id;
    //console.log("profile_id from getBookmarkPosts: ", profile_id);
    const query = `SELECT
    p.*,
      up.profile_image,
      u.first_name,
      u.last_name,
      EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.posts_id AND l.user_id = $1) AS liked,
        true AS bookmarked-- Since the condition in the WHERE guarantees that there's a bookmark, this can be hardcoded to true
    FROM 
    posts p
    JOIN 
    bookmarks b ON p.posts_id = b.post_id AND b.user_id = $1-- Changed LEFT JOIN to JOIN as we are sure of the bookmark relation
LEFT JOIN 
    user_profile up ON p.fk_user = up.profile_id
LEFT JOIN 
    users u ON up.fk_user = u.user_id
ORDER BY
    p.created_at DESC;

    `;
    const value = [profile_id];
    const response = await client.query(query, value);
    res.status(200).json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
}