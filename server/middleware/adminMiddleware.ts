import { NextFunction } from "express";
import jwt from "jsonwebtoken";
import {client} from '../model/db';
import { ReqMid, Token } from '../types/user';
import { Request, Response } from 'express';

export const isAdminAuthenticated = async (req: ReqMid, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.header("Authorization");
        const token = authHeader ? authHeader.replace("Bearer ", "") : null;

        if (!token) {
            return res.status(401).json({ error: "Token not provided!" });
        }

        // Query to check if token exists in the admin_token table
        const query = "SELECT * FROM admin_token WHERE token = $1";
        const params = [token];
        const data = await client.query(query, params);

        if (data.rowCount && data.rowCount < 1) {
            return res.status(401).json({ error: "Unauthorized admin!" });
        }

        const admin_id = data.rows[0].fk_admin;

        // Query to check if admin exists in the admin_table
        const adminQuery = "SELECT email FROM admin_table WHERE admin_id = $1";
        const adminParams = [admin_id];
        const result = await client.query(adminQuery, adminParams);

        if (result.rowCount && result.rowCount < 1) {
            return res.status(401).json({ error: "Invalid admin!" });
        }

        next();
    } catch (err: any) {
        console.error("Authentication error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// Function to generate admin token
export const generateAdminToken = async (user_id: number) => {
    try {
        const key = process.env.TOKEN_SECRET || 'default_secret_key';

        // Generate token with user_id as payload
        const token = jwt.sign({ id: user_id }, key, { expiresIn: '24h' });

        // Insert token into the admin_token table
        const tokenRecord = `
            INSERT INTO admin_token (fk_admin, token, created_at, updated_at) 
            VALUES ($1, $2, DEFAULT, DEFAULT)
        `;
        const params = [user_id, token];
        await client.query(tokenRecord, params);

        return token;
    } catch (err: any) {
        console.error("Token generation error:", err);
        throw new Error("Could not generate token");
    }
}