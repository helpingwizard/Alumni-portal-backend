import express, { Request, Response } from "express";
const { client } = require("../model/db.ts");
exports.getComment = async (req: Request, res: Response) => {
    const fk_post = req.params.post_id;
    //console.log("\n\n"+fk_post)
    try {
        const getCommentQuery = 'SELECT * FROM comments WHERE fk_post = $1 ORDER BY parent_id ASC, comments_id ASC, created_at ASC';
        const values = [fk_post];
        const status2 = await client.query(getCommentQuery, values);
        res.status(200).send(status2.rows);
    }
    catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};
exports.postComment = async (req: Request, res: Response) => {
    const { fk_user, fk_post, comment, created_at} = req.body;
    let parent_id = req.body.parent_id || null;
    try {
        const postCommentQuery = `INSERT INTO comments (fk_user, fk_post, comment, parent_id,created_at) VALUES ($1,$2,$3,$4,$5) RETURNING comments_id`;
        const values = [fk_user, fk_post, comment, parent_id, created_at];
        const status2 = await client.query(postCommentQuery, values);
        const cd = status2.rows[0].comments_id;
        if(parent_id==null)
        {
            const updateParentIdQuery = `
            UPDATE comments
            SET parent_id = $1
            WHERE comments_id = $2`;

        const values2 = [cd, cd];
        const result = await client.query(updateParentIdQuery, values2);
        }
        res.status(200).send("Comment Posted");
        
        //const generatedCommentId = status2.rows[0].comment_id;
        
        // Include the generated comment_id in the response
        //res.status(200).json({ message: "Comment Posted", comment_id: generatedCommentId });
    }
    catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};
exports.deleteComment = async (req: Request, res: Response) => {
    const comments_id = req.params.comments_id;
    const fk_user = req.body.fk_user;
    try {
        // console.log("Deleting comment with ID:", comments_id);
        // console.log("User ID:", fk_user);
        const deleteCommentsQuery= 'DELETE FROM comments WHERE comments_id=$1 AND fk_user=$2';
        const values = [comments_id,fk_user];
        const status2 = await client.query(deleteCommentsQuery, values);
        res.status(200).send("comment deleted");
    }
    catch (error) {
        console.log(error);
        res.status(500).send(error);
    }

};