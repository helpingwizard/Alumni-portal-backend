import express, { Router } from 'express';
import { limiter } from '../middleware/rateLimiter';

const { GetAllInternships,AddWork,DeleteWork,InternshipFilter,JobFilter,WorkFilter,GetAllJobs,getInternshipsByProfile, getWorksByProfile, GetAllInternshipByProfileId} =require('../controllers/internshipController');
const {isAuthenticated } = require('../middleware/userMiddleware');


const intershipRouter:Router = express.Router();
intershipRouter.get("/getAllJobs",isAuthenticated,GetAllJobs);
intershipRouter.get("/getAllInternships",isAuthenticated,GetAllInternships);


intershipRouter.post("/addWork",limiter,isAuthenticated,AddWork);

intershipRouter.get("/workByProfile", isAuthenticated, getWorksByProfile);
intershipRouter.delete("/deleteWork/:work_id",isAuthenticated,DeleteWork);

intershipRouter.get("/filterJob",isAuthenticated,JobFilter);
intershipRouter.get("/filterIntenship",isAuthenticated,InternshipFilter);

intershipRouter.get("/internshipPostsByProfileId/:profileId",isAuthenticated,GetAllInternshipByProfileId);

module.exports= intershipRouter;
//AddInternship