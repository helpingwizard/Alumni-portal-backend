import express, { Router } from 'express';
const {getComment, postComment,deleteComment} = require('../controllers/commentController');

const commentRouter: Router = express.Router();

commentRouter.get('/:post_id',getComment);
commentRouter.post('/',postComment);
commentRouter.delete('/:comments_id',deleteComment);

module.exports = commentRouter;
