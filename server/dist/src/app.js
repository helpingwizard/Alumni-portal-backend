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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const request_1 = __importDefault(require("request"));
dotenv_1.default.config();
require("../model/db");
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const cron = require("node-cron");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use((0, express_session_1.default)({
    secret: 'your-secret-key',
    resave: true,
    saveUninitialized: true,
}));
// Initialize Passport and restore authentication state from session
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        db_1.client.query("SELECT 1;");
        res.status(200).send("Hello");
    }
    catch (err) {
        console.log(err);
    }
}));
const postsRoutes = require('../router/postsRoutes');
const userRoutes = require('../router/userRoutes');
const adminRoutes = require('../router/adminRoutes');
const filterRoutes = require('../router/filterRoutes');
const profileRoutes = require('../router/profileRoutes');
const commentRoutes = require('../router/commentRoutes');
const internshipRoutes = require("../router/internshipRoutes");
const db_1 = require("../model/db");
app.use('/internship', internshipRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/filter', filterRoutes);
app.use('/profile', profileRoutes);
app.use('/posts', postsRoutes);
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`server is running ${port}`);
});
cron.schedule("*/5 * * * *", () => {
    console.log("Sending scheduled request at", new Date().toLocaleDateString(), "at", `${new Date().getHours()}:${new Date().getMinutes()}`);
    (0, request_1.default)(`${process.env.SELF_URL}`, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("im okay");
            // console.log(body) // Optionally, log the response body
        }
    });
});
