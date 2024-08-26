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
exports.generateUserToken = exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../model/db");
const isAuthenticated = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = "select * from user_token where  token= $1"; // changed user_token_id to token for searching
        const authHeader = req.header("Authorization");
        const token = authHeader ? authHeader.replace("Bearer ", "") : null;
        let params = [token];
        const data = yield db_1.client.query(query, params);
        console.log(data.rows);
        if (data.rowCount && data.rowCount < 1) {
            return res.status(401).json({ error: "Unauthorized user!" });
        }
        const user_id = data.rows[0].fk_user;
        query = "select user_id,username,first_name,last_name,phone,email,is_alumni,is_verified,passout_year,created_at,updated_at from users where user_id = $1";
        params = [user_id];
        const result = yield db_1.client.query(query, params);
        if (result.rowCount && result.rowCount < 1) {
            return res.status(401).json({ error: "Invalid User !" });
        }
        req.user = result.rows[0];
        // console.log("req.user: ", req.user);
        req.token = token;
        const isUserHasProfileQuery = `SELECT profile_id FROM user_profile WHERE fk_user=$1`;
        const isUserHasProfileValue = [req.user.user_id];
        const isUserHasProfileResult = yield db_1.client.query(isUserHasProfileQuery, isUserHasProfileValue);
        if (isUserHasProfileResult.rowCount && isUserHasProfileResult.rowCount > 0) {
            req.isUserHasProfile = isUserHasProfileResult.rows[0];
            // console.log("isUserHasProfile: ", req.isUserHasProfile.profile_id);
            next();
        }
        else {
            next();
        }
    }
    catch (err) {
        return res.status(401).json({ error: "Unauthorized user!" });
    }
});
exports.isAuthenticated = isAuthenticated;
const generateUserToken = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(user_id);
        const timeStamp = new Date();
        const key = process.env.TOKEN_SECRET || 'default_secret_key';
        const token = jsonwebtoken_1.default.sign({ id: user_id }, key, { expiresIn: '24h' });
        let tokenRecord = "insert into user_token(fk_user,token,is_valid,created_at,updated_at) values ($1,$2,$3,$4,$5)";
        let params = [user_id, token, true, timeStamp, timeStamp];
        const result = yield db_1.client.query(tokenRecord, params);
        return token;
    }
    catch (err) {
        console.log(err);
    }
});
exports.generateUserToken = generateUserToken;
