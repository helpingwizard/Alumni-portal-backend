"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const { isAuthenticated } = require('../middleware/userMiddleware');
const { getAllPosts, bookmarkPost, getPost, deletePost, updatePost, createPost, createLike, deleteLike, getPostsByProfile, getBookmarkPosts } = require("../controllers/postsController");
const postRouter = express_1.default.Router();
postRouter.get("/", isAuthenticated, getAllPosts);
postRouter.get("/bookmark", isAuthenticated, getBookmarkPosts);
postRouter.get("/:id", isAuthenticated, getPost);
postRouter.post("/like", isAuthenticated, createLike);
postRouter.post("/unlike", isAuthenticated, deleteLike);
postRouter.delete("/deletePost", isAuthenticated, deletePost);
postRouter.post("/bookmark/post", isAuthenticated, bookmarkPost);
postRouter.post("/createPost", isAuthenticated, createPost);
postRouter.post("/:id", isAuthenticated, updatePost);
postRouter.get('/userposts/:id', isAuthenticated, getPostsByProfile);
module.exports = postRouter;
