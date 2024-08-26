import express, { Router } from 'express';
const userRouter: Router = express.Router();
const { SignUserUp, SignUserIn, UserLogout, forgot_password, reset_password, signUpWithGoogle, signUpWithGoogleCallback, validate_token } = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/userMiddleware');

userRouter.post("/signup", SignUserUp);
userRouter.post("/signin", SignUserIn);
userRouter.post("/logout", isAuthenticated, UserLogout);
userRouter.post("/forgot", forgot_password);
userRouter.post("/reset", reset_password);
userRouter.get("/auth/google", signUpWithGoogle);
userRouter.get("/auth/google/callback", signUpWithGoogle, signUpWithGoogleCallback);
userRouter.get("/auth/google/logout", isAuthenticated, UserLogout)
// userRouter.post("/validate-token", validate_token);
module.exports = userRouter;