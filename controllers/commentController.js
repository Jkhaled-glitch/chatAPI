const asyncHandler = require('express-async-handler');
const Comments = require('../models/commentModel');
const Post = require('../models/postModel');

// @desc    create new comment
// @route   POST /users/posts/:postId/comments
// @access  Private
const createComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const postId = req.params.postId;
    const user = req.user;
    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    const comment = await Comments.create({
        user,
        post: postId,
        content,
        reactions: []
    });

    if (comment) {
        await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });
        res.status(201).json(comment);
    } else {
        res.status(400);
        throw new Error('Invalid comment data');
    }
});


// @desc    get all comments for the post
// @route   GET users/posts/:postId/comments
// @access  public

const getAllCommentsForPost = asyncHandler(async (req, res) => {

    const postId = req.params.postId;
    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    const comments = await Comments.find({ post: postId });
    res.status(200).send(comments)
});



// @desc    delete comment
// @route   DELETE /users/posts/:postId/comments/:commentId
// @access  Private (only creator of comment or owner of the post can delete)
const deleteComment = asyncHandler(async (req, res) => {
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }
    const comment = await Comments.findById(commentId);
    if (!comment) {
        res.status(404);
        throw new Error('Comment not found');
    }
    // Check if the comment belongs to the post
    if (comment.post.toString() !== postId) {
        res.status(400);
        throw new Error('the comment does not correspond to the post');
    }

    // Check if the current user is the owner of the post or the owner of comment
    if (post.user.toString() === req.user._id.toString() || comment.user === req.user._id.toString()) {
        res.status(403);
        throw new Error('Unauthorized: Only the owner of the post or the creator of comment can delete a comment');
    }

    //Remove comment ref from Post
    await Post.findByIdAndUpdate(postId, { $pull: { comments: comment._id } });

    // Remove comment from the post's comments array
    await comment.remove();
    res.json({ message: 'Comment has been deleted successfully' })
});



// @desc    add reaction to a comment
// @route   PUT /users/posts/:postId/comments/:commentId/addReaction
// @access  Private
const addReaction = asyncHandler(async (req, res) => {
    const { type } = req.body;
    const userId = req.user._id;
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    const comment = await Comments.findById(commentId);

    if (!comment) {
        res.status(404);
        throw new Error('Comment not found');
    }

    // Check if the comment belongs to the post
    if (comment.post.toString() !== postId) {
        res.status(400);
        throw new Error('the comment does not correspond to the post');
    }

    // Add reaction to the reactions array
    // Check if the user has already reacted
    const existingReaction = comment.reactions.find(reaction => reaction.user.toString() === userId.toString());

    if (existingReaction) {
        existingReaction.type = type;
    } else {
        comment.reactions.push({
            user: userId,
            type
        });
    }

    await comment.save();
    res.status(200).json({ message: 'Reaction added successfully' });
});





// @desc    remove reaction to a comment
// @route   PUT users/posts/:postId/comments/:commentId/removeReaction
// @access  Private

const removeReaction = asyncHandler(async (req, res) => {
    const  userId  = req.user._id;
    const postId = req.params.postId;
    const commentId = req.params.commentId;


    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    const comment = await Comments.findById(commentId);
    if (!comment) {
        res.status(404);
        throw new Error('Comment not found');
    }

    // Check if the comment belongs to the post
    if (comment.post.toString() !== postId) {
        res.status(400);
        throw new Error('The comment does not correspond to the post');
    }
    // Find the index of the reaction in the reactions array
    const reactionIndex = comment.reactions.findIndex(reaction => reaction.user.toString() === userId.toString());

    // Check if the reaction exists in the comment
    if (reactionIndex === -1) {
        res.status(404);
        throw new Error('Reaction not found');
    }

    // Remove the reaction from the reactions array
    comment.reactions.splice(reactionIndex, 1);
      
    // Save the updated comment
    await comment.save();
    res.status(200).json({ message: 'Reaction removed successfully' });
});



module.exports = {
    createComment,
    getAllCommentsForPost,
    deleteComment,
    addReaction,
    removeReaction
};
