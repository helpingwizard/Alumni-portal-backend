import express, { Request, Response, Application, urlencoded } from "express";
import jwt from "jsonwebtoken";
// import { generateUserToken } from "../middleware/userMiddleware";
import bcrypt from "bcryptjs";
import { client } from "../model/db";
import { QueryResult } from "pg";
const { sendOtpMail } = require("../emails/ses");
import { UserBody, ReqMid, GoogleUserData } from "../types/user";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { profile } from "console";
import crypto from 'crypto';

const { generateUserToken } = require("../middleware/userMiddleware");
const _ = require('lodash');
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || "", 'hex');
const IV_LENGTH = 16; // For AES, this is always 16


// Configure session middleware

passport.use(
  new GoogleStrategy(
    {
      clientID:
        "659738780644-osvspso5cvlph3d8f93cv40aplijh5qm.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "http://localhost:5000/user/auth/google/callback",
    },
    async (accessToken, refreshToken, profile: any, done) => {
      // Extract relevant information from the Google profile
      //console.log(profile)
      const userData: any = {
        first_name: profile.name.givenName,
        last_name: profile.name.familyName,
        email: profile.emails[0].value,
        // You may need to handle phone number differently, as it might not be available in all profiles
        phone: "", // Set appropriately based on the available data
      };
      const user = await client.query("SELECT * FROM users WHERE email = $1", [
        userData.email,
      ]);
      if (user.rows.length > 0) {
        return done(null, user.rows[0]);
      }
      const insertGoogleUser: string =
        "INSERT INTO users (username,first_name, last_name, email, phone,is_alumni,is_verified,user_password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6,$7,$8,$9,$10) RETURNING user_id, first_name, last_name, email";

      // Get the current timestamp in ISO format
      const timeStamp: string = new Date().toISOString();

      // Prepare the values for the SQL query
      const values: any[] = [
        userData.first_name + userData.last_name,
        userData.first_name,
        userData.last_name,
        userData.email,
        userData.phone || 0,
        false,
        false,
        "login_with_google", // You may need to adjust this based on the actual structure of userData
        timeStamp,
        timeStamp,
      ];
      //console.log(values);
      // Execute the SQL query to insert the user data into the database
      const result = await client.query(insertGoogleUser, values);

      //console.log(result.rows[0]);
      // Pass user data to the done callback
      return done(null, result.rows[0]);
    }
  )
);

const signUpWithGoogle = passport.authenticate("google", {
  scope: ["profile", "email"],
});

passport.serializeUser((user: any, done) => {
  done(null, user.user_id); // Assuming the user object has an 'id' property
});

passport.deserializeUser(async (id: any, done) => {
  try {
    // Retrieve the user from the database based on the 'id'
    const userResult = await client.query(
      "SELECT * FROM users WHERE user_id = $1",
      [id]
    );
    //console.log(userResult.rows[0]);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      // Only pass user data to the 'done' callback
      done(null, user);
    } else {
      done(new Error("User not found"));
    }
  } catch (error) {
    done(error);
  }
});

const signUpWithGoogleCallback = async (
  req: ReqMid & { user?: GoogleUserData },
  res: Response
) => {
  // Access user data from the req.user object populated by the GoogleStrategy
  const userData: any = req.user;

  // You can now use the userData to create a new user in your database
  // Modify the following code to match your database schema and user creation logic
  if (userData) {
    //console.log(userData);
    const token = await generateUserToken(userData.user_id);
    res
      .status(201)
      .json({
        message: "User created successfully.",
        user: { ...userData, token: token },
      });
  }
};
// Function to handle user signup
const SignUserUp = async (req: UserBody, res: Response) => {
  // SQL query to insert user details into the 'users' table in the database

  if (
    !req.body.username ||
    !req.body.first_name ||
    !req.body.last_name ||
    !req.body.phone ||
    !req.body.user_password ||
    !req.body.phone ||
    !req.body.email ||
    !req.body.passout_year
  ) {
    res.status(401).json({ error: "Fill all the fields" });
  } else {
    const insertUser: string =
      "INSERT INTO users (username, first_name, last_name, phone, email, user_password, is_alumni, is_verified, passout_year, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING user_id, username, email, created_at";

    // Get the current timestamp in ISO format
    const timeStamp: string = new Date().toISOString();

    // Hash the user's password using bcrypt
    const hashPassword = await bcrypt.hash(req.body.user_password, 10);

    // Prepare the values for the SQL query
    const values: any[] = [
      req.body.username,
      req.body.first_name,
      req.body.last_name,
      req.body.phone,
      req.body.email.toLowerCase(),
      hashPassword,
      false, // is_alumni (modify this based on your requirements)
      false, // is_verified (modify this based on your requirements)
      req.body.passout_year,
      timeStamp,
      timeStamp,
    ];

    try {
      // Execute the SQL query to insert the user data into the database
      const result: QueryResult<any> = await client.query(insertUser, values);
      const data = result.rows; // Access the rows returned by the query

      //console.log(data); // Log the data returned by the query (for debugging purposes)
      const token = await generateUserToken(data[0].user_id);

      const email = req?.body?.email;
      const text = `select * from users where email='${email}';`;
      //console.log(text);
      const userData: QueryResult<any> = await client.query(text);
      const user = userData.rows[0];
      const userWithoutPassword = _.omit(user, 'user_password');
      // Send a success response to the client
      res
        .status(200)
        .json({ message: "User created successfully.", token: token, user: userWithoutPassword });
    } catch (err: any) {
      // Handle errors that occurred during the database operation

      // Extract the duplicate error message from the error object
      const duplicateError: string = err.message
        .split(" ")
        .pop()
        .replaceAll('"', "");

      if (duplicateError === "users_email_key") {
        // If a user with the same email already exists, send a 409 Conflict response
        res.status(409).json({ error: "User with this email already exists." });
      } else if (duplicateError === "users_phone_key") {
        res
          .status(409)
          .json({ error: "User with this mobile_number already extsts" });
      }
      else if (duplicateError === "users_username_key") {
        res
          .status(409)
          .json({ error: "UserName taken" });
      } else {
        // For other errors, log the error and send a 500 Internal Server Error response
        console.log(err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  }
};
const SignUserIn = async (req: UserBody, res: Response) => {
  try {
    if (!req.body.email || !req.body.user_password) {
      res.status(401).json({ status: false, message: "Fill all the fields" });
    } else {
      const email = req?.body?.email;
      const text = `select * from users where email='${email}';`;
      // console.log(text);
      const data: QueryResult<any> = await client.query(text);
      //console.log(data.rows[0]);
      if (data.rowCount === 1) {
        const auth = await bcrypt.compare(
          req.body.user_password,
          data.rows[0].user_password
        );
        if (auth) {
          const token = await generateUserToken(data.rows[0].user_id);
          const user = data.rows[0];

          delete user.password;

          const user_profile = await client.query(
            `select * from user_profile where fk_user = $1`, [user.user_id]
          );
          return res.json({
            status: true,
            token: token,
            user: user,
            profile: user_profile.rows[0],
            message: "User logged in successfully"
          });
        } else {
          return res.status(400).json({ status: false, message: "Invalid password" });
        }
      } else {
        return res.status(400).json({ status: false, message: "User Not Found" });
      }
    }
  } catch (err: any) {
    res.status(400).json({ status: false, message: "Internal server error" });
  }
};
const UserLogout = async (req: ReqMid, res: Response) => {
  if (!req.token) {
    return res.status(401).json({ error: "You are already logged out" });
  }

  const removeUser: string = "DELETE FROM user_token WHERE token = $1";

  const value: any[] = [req.token];

  try {
    const result: QueryResult<any> = await client.query(removeUser, value);

    return res.status(200).json({ success: "User logged out successfully!" });
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: "An error occurred while logging out" });
  }
};

const OTPSend = async (email: string, res: Response) => {
  try {

    //const email: string = req.body.email?.toLowerCase();
    //console.log("email: ", email)
    let user: QueryResult<any> = await client.query(
      "select * from users where email = $1",
      [email]
    );
    //console.log("user:", user.rows[0]);
    if (user.rowCount === 0) {
      res.status(404).json({ message: "User Not Found" });
      return;
    }
    let result = user.rows[0];
    var minm: number = 100000;
    var maxm: number = 999999;
    const otp: number = Math.floor(Math.random() * (maxm - minm + 1)) + minm;
    const key = process.env.TOKEN_SECRET || "default_secret_key";
    const token: string = jwt.sign({ otp }, key, { expiresIn: "900s" });
    user = await client.query("update users set otp = $1 where email = $2", [
      token,
      email,
    ]);
    //console.log("data:",result.first_name,email,otp);
    sendOtpMail(result.first_name, email, otp);
    res.status(200).json({ status: true, message: "OTP sent Successfully" });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const OTPVerify = async (email: string, otp: any, res: Response) => {
  try {
    // const email: string = req.body.email?.toLowerCase();
    // const otp: any = req.body.otp; // OTP entered by the user
    // console.log(req.body)
    const user: QueryResult<any> = await client.query(
      "select * from users where email = $1",
      [email]
    );
    if (user.rowCount === 0) {
      res.status(404).json({ status: false, message: "User Not Found" });
      throw new Error("User not found");
    }

    const token: string = user.rows[0].otp;
    //console.log(token)
    const key = process.env.TOKEN_SECRET || "default_secret_key";
    try {
      const decoded: any = jwt.verify(token, key);
      //console.log(decoded.otp, " = ", otp)
      if (decoded.otp == otp) {
        res.status(200).json({ status: true, message: "OTP Verified Successfully" });
      } else {
        res.status(400).json({ status: false, message: "Invalid OTP" });
      }
    } catch (err: any) {
      console.log(err);
      res.status(500).json({ status: false, message: "Invalid OTP" });
    }
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const forgot_password = async (req: any, res: Response) => {
  try {
    const email: string = req.body.email?.toLowerCase();
    const otp: any = req.body.otp;
    if (otp) {
      //console.log("otp verification")
      await OTPVerify(email, otp, res);

    }
    else {
      //console.log("otp send");
      await OTPSend(email, res);
    }
  } catch (err: any) {
    console.log("error in forgot password");
  }
}

const reset_password = async (req: any, res: Response) => {
  try {
    const email: string = req.body.email;
    const npassword = req.body.password;
    const otp: string = req.body.otp;
    //console.log(npassword);
    const user: QueryResult<any> = await client.query(
      "select * from users where email = $1",
      [email]
    );
    if (user.rowCount === 0) {
      res.status(404).json({ status: false, message: "User Not Found" });
      throw new Error("User not found");
    }
    //console.log(user.rows[0]);
    const key = process.env.TOKEN_SECRET || "default_secret_key";
    if (!user.rows[0].otp) {
      res.status(401).json({ "message": "Unothorized request" });
      return;
    }
    const decoded: any = jwt.verify(user.rows[0].otp, key);
    //console.log(decoded.otp,otp);
    if (decoded.otp == otp) {
      await client.query('UPDATE users SET otp = null WHERE email = $1', [email]);
    }
    else {
      res.status(401).json({ status: false, message: "Unothorized request" });
      return;
    }
    const hashPassword = await bcrypt.hash(npassword, 10);
    //console.log("new:",hashPassword);
    await client.query('UPDATE users SET user_password = $1 WHERE email = $2', [hashPassword, email]);
    //console.log(user.rows[0]);
    res.status(200).json({ "status": true, "message": "password reset successfully" });

  } catch (err: any) {
    console.log(err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
}

// const validate_token = async (req: any, res: Response) => {
//   const { token, fullName } = req.body;
//   try {
//     // Split the token into IV and encrypted text
//     const [ivHex, encryptedTextHex] = token.split(':');
//     if (!ivHex || !encryptedTextHex) {
//       throw new Error('Invalid token format');
//     }

//     const iv = Buffer.from(ivHex, 'hex');
//     const encryptedText = Buffer.from(encryptedTextHex, 'hex');

//     // Ensure IV and encrypted text lengths are correct
//     if (iv.length !== IV_LENGTH) {
//       throw new Error('Invalid IV length');
//     }

//     // Create decipher instance
//     const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

//     // Decrypt the text
//     let decrypted = decipher.update(encryptedText);
//     decrypted = Buffer.concat([decrypted, decipher.final()]);

//     // Convert decrypted buffer to string
//     const decryptedText = decrypted.toString();

//     // Split the decrypted text to extract email, full name, and batch
//     const [email, batch] = decryptedText.split(':');
//     const [firstName, lastName] = fullName.split(' ');

//     console.log("Singnup User: ", fullName)

//     return res.json({
//       email,
//       first_name: firstName,
//       last_name: lastName,
//       passout_year: batch
//     });
//   } catch (error) {
//     return res.status(400).json({ error: 'Signups are not allowed' });
//   }
// };


module.exports = {
  SignUserUp,
  SignUserIn,
  UserLogout,
  forgot_password,
  reset_password,
  signUpWithGoogle,
  signUpWithGoogleCallback,
  // validate_token
};
