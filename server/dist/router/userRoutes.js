"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userRouter = express_1.default.Router();
const { SignUserUp, SignUserIn, UserLogout, OTPSend, OTPVerify, signUpWithGoogle, signUpWithGoogleCallback } = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/userMiddleware');
userRouter.post("/signup", SignUserUp);
userRouter.post("/signin", SignUserIn);
userRouter.post("/logout", isAuthenticated, UserLogout);
userRouter.post("/sendOtp", OTPSend);
userRouter.post("/verifyOTP", OTPVerify);
userRouter.get("/auth/google", signUpWithGoogle);
userRouter.get("/auth/google/callback", signUpWithGoogle, signUpWithGoogleCallback);
userRouter.get("/auth/google/logout", isAuthenticated, UserLogout);
module.exports = userRouter;
