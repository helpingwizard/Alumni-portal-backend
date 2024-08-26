import express from 'express';
const { isAdminAuthenticated } = require('../middleware/adminMiddleware');
const adminRouter = express.Router();
const { SignAdminUp, SignAdminIn, AlumniVerification, AlumniVerificationInfo, AdminLogout, getUsers, getReports, deletePost, deleteUser, getAlumnis, getCount, getChartData, getALLFeedbacks, makeAlumni, deleteFeedback, deleteAllAdmins,AddNews,DeleteNews,getAnnouncements } = require('../controllers/adminController');


// adminRouter.post("/signup", SignAdminUp);
adminRouter.post("/signin", SignAdminIn);
adminRouter.post("/logout", isAdminAuthenticated, AdminLogout);
adminRouter.get("/getUsers", isAdminAuthenticated, getUsers);
adminRouter.get("/alumniVerificationRecord", isAdminAuthenticated, AlumniVerificationInfo);
adminRouter.post("/alumniVerification", isAdminAuthenticated, AlumniVerification);;
adminRouter.delete('/deleteUser', isAdminAuthenticated, deleteUser);
adminRouter.delete('/deletePost/:id', isAdminAuthenticated, deletePost);
adminRouter.get('/getReports', isAdminAuthenticated, getReports);
adminRouter.post('/makeAlumni', isAdminAuthenticated, makeAlumni);
adminRouter.get('/getAlumnis', isAdminAuthenticated, getAlumnis);
adminRouter.get('/getCount', isAdminAuthenticated, getCount);
adminRouter.get("/getFeedbacks/:type", isAdminAuthenticated, getALLFeedbacks);
adminRouter.get("/chartData", isAdminAuthenticated, getChartData);
adminRouter.delete('/deleteFeedback', isAdminAuthenticated, deleteFeedback);
adminRouter.post('/addNews',isAdminAuthenticated,AddNews);
adminRouter.delete("/deleteNews",isAdminAuthenticated,DeleteNews);
adminRouter.get("/getnews/news",isAdminAuthenticated,getAnnouncements)

// adminRouter.delete('/deleteAllAdmins',  deleteAllAdmins);


module.exports = adminRouter;
