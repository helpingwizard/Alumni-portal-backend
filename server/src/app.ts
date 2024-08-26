import express, { Request, Response, Application, urlencoded } from 'express';
import dotenv from 'dotenv';
import { error } from 'console';
import cors from 'cors';
import request from "request"
dotenv.config();
require("../model/db");
import passport from 'passport';
import session from 'express-session';
const cron = require("node-cron");
import axios from 'axios';

const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);

app.use(cors());

app.use(session({
    secret: 'your-secret-key',
    resave: true,
    saveUninitialized: true,
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

app.get('/', async (req: Request, res: Response) => {
    try {
        client.query("SELECT 1;");
        res.status(200).send("Hello");
    }
    catch (err: any) {
        console.log(err);
    }
})
const postsRoutes = require('../router/postsRoutes');
const userRoutes = require('../router/userRoutes');
const adminRoutes = require('../router/adminRoutes');
const filterRoutes = require('../router/filterRoutes');
const profileRoutes = require('../router/profileRoutes');
const commentRoutes = require('../router/commentRoutes');
const internshipRoutes = require("../router/internshipRoutes");
//const s3Routes = require('../router/s3Routes');
import { client } from '../model/db';


app.use('/internship', internshipRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/filter', filterRoutes);
app.use('/profile', profileRoutes);
app.use('/posts', postsRoutes);
//app.use('/s3', s3Routes);
const port = process.env.PORT || 3001;


app.listen(port, (): void => {
    console.log(`server is running ${port}`);
})

cron.schedule("*/5 * * * *", () => {
    console.log("Sending scheduled request at", new Date().toLocaleDateString(), "at", `${new Date().getHours()}:${new Date().getMinutes()}`);
    request(`${process.env.SELF_URL}`, function (error: Error, response: any) {
        if (!error && response.statusCode == 200) {
            console.log("im okay");
            // console.log(body) // Optionally, log the response body
        }
    });
});
