import express, { Router } from 'express'
const {isAuthenticated } = require('../middleware/userMiddleware');
const { getAllProfiles , getProfile, postUserProfiles, updateProfiles, deleteProfiles, postFeedback, isAlumniQuery } = require("../controllers/profileController")
const {addCompany, deleteCompany, addDomain,deleteDomain,addskills,deleteSkill,addUniversity,getAllDomains}=require("../controllers/domainController");
import {updateProfileBanner, updateProfileImage} from "../controllers/profileController";
const profileRouter: Router = express.Router();

profileRouter.get("/",isAuthenticated, getAllProfiles);
profileRouter.get("/:id",isAuthenticated, getProfile);
profileRouter.post('/', isAuthenticated, postUserProfiles);
profileRouter.put('/',isAuthenticated, updateProfiles);
profileRouter.delete('/deleteProfile/:id',isAuthenticated, deleteProfiles);
profileRouter.post('/feedback',isAuthenticated, postFeedback);
profileRouter.post("/company", isAuthenticated, addCompany);
profileRouter.delete('/company/delete',isAuthenticated,deleteCompany)
profileRouter.post("/domain",isAuthenticated, addDomain);
profileRouter.delete("/domain/delete",isAuthenticated,deleteDomain);
profileRouter.post("/skill",isAuthenticated,addskills);
profileRouter.delete("/skill/delete",isAuthenticated,deleteSkill);
profileRouter.post("/university",addUniversity);
profileRouter.get("/alldomains",getAllDomains);
profileRouter.patch('/image',isAuthenticated, updateProfileImage);
profileRouter.patch('/banner',isAuthenticated, updateProfileBanner);
profileRouter.patch('/isAlumni', isAuthenticated, isAlumniQuery);

module.exports = profileRouter  