import express, { Router } from 'express';
import { limiter } from '../middleware/rateLimiter';
const { isAuthenticated } = require('../middleware/userMiddleware');
const { getAllPosts, bookmarkPost, getPost, deletePost, updatePost, createPost, createLike, deleteLike, getPostsByProfile, getBookmarkPosts, getNews } = require("../controllers/postsController");
const postRouter: Router = express.Router()

postRouter.get("/", isAuthenticated, getAllPosts);
postRouter.get("/bookmark", isAuthenticated, getBookmarkPosts);
postRouter.get("/:id", isAuthenticated, getPost);
postRouter.post("/like", isAuthenticated, createLike);
postRouter.post("/unlike", isAuthenticated, deleteLike);
postRouter.delete("/deletePost", isAuthenticated, deletePost);
postRouter.post("/bookmark/post", isAuthenticated, bookmarkPost);
postRouter.post("/createPost",limiter, isAuthenticated, createPost);
postRouter.post("/:id", isAuthenticated, updatePost);
postRouter.get('/userposts/:id', isAuthenticated, getPostsByProfile)
postRouter.get('/updates/news',isAuthenticated, getNews)
module.exports = postRouter