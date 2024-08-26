"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminRouter = express_1.default.Router();
const { SignAdminUp, SignAdminIn, AdminLogout } = require('../controllers/adminController');
adminRouter.post("/signup", SignAdminUp);
adminRouter.post("/signin", SignAdminIn);
adminRouter.post("/logout", AdminLogout);
module.exports = adminRouter;
