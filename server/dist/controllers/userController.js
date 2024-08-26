"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// import { generateUserToken } from "../middleware/userMiddleware";
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../model/db");
const { sendOtpMail } = require("../emails/ses");
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const { generateUserToken } = require("../middleware/userMiddleware");
// Configure session middleware
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: "659738780644-osvspso5cvlph3d8f93cv40aplijh5qm.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:5000/user/auth/google/callback",
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract relevant information from the Google profile
    //console.log(profile)
    const userData = {
        first_name: profile.name.givenName,
        last_name: profile.name.familyName,
        email: profile.emails[0].value,
        // You may need to handle phone number differently, as it might not be available in all profiles
        phone: "", // Set appropriately based on the available data
    };
    const user = yield db_1.client.query("SELECT * FROM users WHERE email = $1", [
        userData.email,
    ]);
    if (user.rows.length > 0) {
        return done(null, user.rows[0]);
    }
    const insertGoogleUser = "INSERT INTO users (username,first_name, last_name, email, phone,is_alumni,is_verified,user_password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6,$7,$8,$9,$10) RETURNING user_id, first_name, last_name, email";
    // Get the current timestamp in ISO format
    const timeStamp = new Date().toISOString();
    // Prepare the values for the SQL query
    const values = [
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
    const result = yield db_1.client.query(insertGoogleUser, values);
    //console.log(result.rows[0]);
    // Pass user data to the done callback
    return done(null, result.rows[0]);
})));
const signUpWithGoogle = passport_1.default.authenticate("google", {
    scope: ["profile", "email"],
});
passport_1.default.serializeUser((user, done) => {
    done(null, user.user_id); // Assuming the user object has an 'id' property
});
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Retrieve the user from the database based on the 'id'
        const userResult = yield db_1.client.query("SELECT * FROM users WHERE user_id = $1", [id]);
        console.log(userResult.rows[0]);
        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            // Only pass user data to the 'done' callback
            done(null, user);
        }
        else {
            done(new Error("User not found"));
        }
    }
    catch (error) {
        done(error);
    }
}));
const signUpWithGoogleCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Access user data from the req.user object populated by the GoogleStrategy
    const userData = req.user;
    // You can now use the userData to create a new user in your database
    // Modify the following code to match your database schema and user creation logic
    if (userData) {
        console.log(userData);
        const token = yield generateUserToken(userData.user_id);
        res
            .status(201)
            .json({
            message: "User created successfully.",
            user: Object.assign(Object.assign({}, userData), { token: token }),
        });
    }
});
// Function to handle user signup
const SignUserUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // SQL query to insert user details into the 'users' table in the database
    var _a;
    if (!req.body.username ||
        !req.body.first_name ||
        !req.body.last_name ||
        !req.body.phone ||
        !req.body.user_password ||
        !req.body.phone ||
        !req.body.email ||
        !req.body.passout_year) {
        res.status(401).json({ error: "Fill all the fields" });
    }
    else {
        const insertUser = "INSERT INTO users (username, first_name, last_name, phone, email, user_password, is_alumni, is_verified, passout_year, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING user_id, username, email, created_at";
        // Get the current timestamp in ISO format
        const timeStamp = new Date().toISOString();
        // Hash the user's password using bcrypt
        const hashPassword = yield bcryptjs_1.default.hash(req.body.user_password, 10);
        // Prepare the values for the SQL query
        const values = [
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
            const result = yield db_1.client.query(insertUser, values);
            const data = result.rows; // Access the rows returned by the query
            console.log(data); // Log the data returned by the query (for debugging purposes)
            const token = yield generateUserToken(data[0].user_id);
            const email = (_a = req === null || req === void 0 ? void 0 : req.body) === null || _a === void 0 ? void 0 : _a.email;
            const text = `select * from users where email='${email}';`;
            console.log(text);
            const userData = yield db_1.client.query(text);
            const user = userData.rows[0];
            // Send a success response to the client
            res
                .status(200)
                .json({ message: "User created successfully.", token: token, user: user });
        }
        catch (err) {
            // Handle errors that occurred during the database operation
            // Extract the duplicate error message from the error object
            const duplicateError = err.message
                .split(" ")
                .pop()
                .replaceAll('"', "");
            if (duplicateError === "users_email_key") {
                // If a user with the same email already exists, send a 409 Conflict response
                res.status(409).json({ error: "User with this email already exists." });
            }
            else if (duplicateError === "users_phone_key") {
                res
                    .status(409)
                    .json({ error: "User with this mobile_number already extsts" });
            }
            else if (duplicateError === "users_username_key") {
                res
                    .status(409)
                    .json({ error: "UserName taken" });
            }
            else {
                // For other errors, log the error and send a 500 Internal Server Error response
                console.log(err);
                res.status(500).json({ error: "Internal Server Error" });
            }
        }
    }
});
const SignUserIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        if (!req.body.email || !req.body.user_password) {
            res.status(401).json({ status: false, message: "Fill all the fields" });
        }
        else {
            const email = (_b = req === null || req === void 0 ? void 0 : req.body) === null || _b === void 0 ? void 0 : _b.email;
            const text = `select * from users where email='${email}';`;
            // console.log(text);
            const data = yield db_1.client.query(text);
            console.log(data.rows[0]);
            if (data.rowCount === 1) {
                const auth = yield bcryptjs_1.default.compare(req.body.user_password, data.rows[0].user_password);
                if (auth) {
                    const token = yield generateUserToken(data.rows[0].user_id);
                    const user = data.rows[0];
                    delete user.password;
                    const user_profile = yield db_1.client.query(`select * from user_profile where fk_user = $1`, [user.user_id]);
                    return res.json({
                        status: true,
                        token: token,
                        user: user,
                        profile: user_profile.rows[0],
                        message: "User logged in successfully"
                    });
                }
                else {
                    return res.status(400).json({ status: false, message: "Invalid password" });
                }
            }
            else {
                return res.status(400).json({ status: false, message: "User Not Found" });
            }
        }
    }
    catch (err) {
        res.status(400).json({ status: false, message: "Internal server error" });
    }
});
const UserLogout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.token) {
        return res.status(401).json({ error: "You are already logged out" });
    }
    const removeUser = "DELETE FROM user_token WHERE token = $1";
    const value = [req.token];
    try {
        const result = yield db_1.client.query(removeUser, value);
        return res.status(200).json({ success: "User logged out successfully!" });
    }
    catch (err) {
        return res
            .status(500)
            .json({ error: "An error occurred while logging out" });
    }
});
const OTPSend = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const email = (_c = req.body.email) === null || _c === void 0 ? void 0 : _c.toLowerCase();
        console.log("email: ", email);
        let user = yield db_1.client.query("select * from users where email = $1", [email]);
        console.log("user:", user.rows[0]);
        if (user.rowCount === 0) {
            res.status(404).json({ message: "User Not Found" });
        }
        let result = user.rows[0];
        var minm = 100000;
        var maxm = 999999;
        const otp = Math.floor(Math.random() * (maxm - minm + 1)) + minm;
        const key = process.env.TOKEN_SECRET || "default_secret_key";
        const token = jsonwebtoken_1.default.sign({ otp }, key, { expiresIn: "900s" });
        user = yield db_1.client.query("update users set otp = $1 where email = $2", [
            token,
            email,
        ]);
        sendOtpMail(result.name, email, otp);
        res.status(200).json({ status: true, message: "OTP sent Successfully" });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
});
const OTPVerify = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const email = (_d = req.body.email) === null || _d === void 0 ? void 0 : _d.toLowerCase();
        const otp = req.body.otp; // OTP entered by the user
        console.log(req.body);
        const user = yield db_1.client.query("select * from users where email = $1", [email]);
        if (user.rowCount === 0) {
            res.status(404).json({ status: false, message: "User Not Found" });
            return;
        }
        const token = user.rows[0].otp;
        console.log(token);
        const key = process.env.TOKEN_SECRET || "default_secret_key";
        try {
            const decoded = jsonwebtoken_1.default.verify(token, key);
            console.log(decoded.otp, " = ", otp);
            if (decoded.otp == otp) {
                yield db_1.client.query("update users set otp = null where email = $1", [
                    email,
                ]);
                res.status(200).json({ status: true, message: "OTP Verified Successfully" });
            }
            else {
                res.status(400).json({ status: false, message: "Invalid OTP" });
            }
        }
        catch (err) {
            console.log(err);
            res.status(500).json({ status: false, message: "Invalid OTP" });
        }
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
});
module.exports = {
    SignUserUp,
    SignUserIn,
    UserLogout,
    OTPSend,
    OTPVerify,
    signUpWithGoogle,
    signUpWithGoogleCallback,
};
