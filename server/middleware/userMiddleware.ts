import { NextFunction } from "express";
import jwt from "jsonwebtoken";
import { client } from '../model/db';
import { ReqMid, Token } from '../types/user';
import { Request, Response } from 'express';
export const isAuthenticated = async (req: ReqMid, res: Response, next: NextFunction) => {
    try {
        let query: string = "select * from user_token where  token= $1"; // changed user_token_id to token for searching
        const authHeader = req.header("Authorization");
        const token = authHeader ? authHeader.replace("Bearer ", "") : null;
        let params = [token];
        const data = await client.query(query, params);
        //console.log(data.rows);
        if (data.rowCount && data.rowCount < 1) {
            return res.status(401).json({ error: "Unauthorized user!" });
        }
        const user_id = data.rows[0].fk_user;
        query = "select user_id,username,first_name,last_name,phone,email,is_alumni,is_verified,passout_year,created_at,updated_at from users where user_id = $1";
        params = [user_id];
        const result = await client.query(query, params);
        if (result.rowCount && result.rowCount < 1) {
            return res.status(401).json({ error: "Invalid User !" });
        }




        req.user = result.rows[0];
        // console.log("req.user: ", req.user);
        req.token = token as string;

        const isUserHasProfileQuery = `SELECT profile_id FROM user_profile WHERE fk_user=$1`;
        const isUserHasProfileValue = [req.user.user_id];
        const isUserHasProfileResult = await client.query(isUserHasProfileQuery, isUserHasProfileValue);
        if (isUserHasProfileResult.rowCount && isUserHasProfileResult.rowCount > 0) {
            req.isUserHasProfile = isUserHasProfileResult.rows[0];
            // console.log("isUserHasProfile: ", req.isUserHasProfile.profile_id);
            next();
        } else {
            next();
        }


    } catch (err: any) {
        return res.status(401).json({ error: "Unauthorized user!" });
    }
}
export const generateUserToken = async (user_id: number) => {
    try {
        //console.log(user_id);
        const timeStamp = new Date();
        const key = process.env.TOKEN_SECRET || 'default_secret_key';
        const token = jwt.sign({ id: user_id }, key, { expiresIn: '24h' });
        let tokenRecord = "insert into user_token(fk_user,token,is_valid,created_at,updated_at) values ($1,$2,$3,$4,$5)";
        let params = [user_id, token, true, timeStamp, timeStamp];
        const result = await client.query(tokenRecord, params);
        return token;
    } catch (err: any) {
        console.log(err);
    }
}
