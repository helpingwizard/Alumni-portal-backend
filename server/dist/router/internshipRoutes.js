"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const { AddInternship, DeleteInternship, GetAllInternships, GetAllWorks, AddWork, DeleteWork, InternshipFilter, WorkFilter } = require('../controllers/internshipController');
const { isAuthenticated } = require('../middleware/userMiddleware');
const intershipRouter = express_1.default.Router();
intershipRouter.get("/", isAuthenticated, GetAllInternships);
intershipRouter.post("/addinternship", isAuthenticated, AddInternship);
intershipRouter.delete("/deleteInternship/:internship_id", isAuthenticated, DeleteInternship);
intershipRouter.get("/works", isAuthenticated, GetAllWorks);
intershipRouter.post("/addwork", isAuthenticated, AddWork);
intershipRouter.delete("/deleteWork/:work_id", isAuthenticated, DeleteWork);
intershipRouter.get("/filterinternship", isAuthenticated, InternshipFilter);
intershipRouter.get("/filterwork", isAuthenticated, WorkFilter);
module.exports = intershipRouter;
//AddInternship 
