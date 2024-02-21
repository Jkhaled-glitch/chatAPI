const asyncHandler = require('express-async-handler');
const Post = require('../models/postModel');
const Comments = require('../models/commentModel')

// @desc    create new post
// @route   POST /users/posts
// @access  Private
const createPost = asyncHandler(async (req, res) => {
    const user = req.user;
    const { contentType, contentText, contentUrl, contentFiles } = req.body;

    const post = await Post.create({
        user,
        contentType,
        contentText,
        contentUrl,
        contentFiles,
        reactions: [],
        comments: [],
        shares: [],
    });

    if (post) {
        res.status(201).json(post);
    } else {
        res.status(400);
        throw new Error('Invalid post data');
    }
});

// @desc    get all user posts
// @route   GET /users/posts
// @access  private
const getPosts = asyncHandler(async (req, res) => {
    const user = req.user;
    const posts = await Post.find({ user: user._id });
    res.json(posts);
});

// @desc    get post by id
// @route   GET /users/posts/:postId
// @access  Public
const getPostById = asyncHandler(async (req, res) => {
    const postId = req.params.postId;
    const post = await Post.findById(postId);

    if (!post) {
        res.status(404);
        throw new Error('Post not found');  
    } 
    res.status(200).json(post);
});

// @desc    delete post
// @route   DELETE /users/posts/:postId
// @access  Private (only creator of pub can deleted)
const deletePost = asyncHandler(async (req, res) => {
    const postId = req.params.postId;
    const post = await Post.findById(postId);

    if (post) {
        if (post.user.toString() === req.user._id.toString()) {

            await Comments.deleteMany({ post: postId });
            await post.remove();
            res.json({ message: 'Post has been deleted successfully' });
        } else {
            res.status(403);
            throw new Error('Unauthorized: Only the creator can delete the post');
        }
    } else {
        res.status(404);
        throw new Error('Post not found');
    }
});


// @desc    Share post
// @route   POST /users/posts/:postId/shares
// @access  Private
const sharePost = async (req, res) => {
    const userId = req.user._id;
    const postId = req.params.postId;

    const originalPost = await Post.findById(postId);

    if (!originalPost) {
        return res.status(404).json({ message: 'originale post not found' });
    }

    const sharedPost = new Post({
        user: userId, 
        contentType: originalPost.contentType,
        contentText: originalPost.contentText,
        contentUrl: originalPost.contentUrl,
        contentFiles: originalPost.contentFiles,
        shared: {
            isShared: true,
            originalPost: originalPost._id 
        }
    });
    

    const savedPost = await sharedPost.save();
    if (!savedPost) {
        return res.status(500).json({ message: 'Internal server error' });
    }
    // Update the original post with the ID of the shared post
    await Post.findByIdAndUpdate(postId, {
        $push: { shares: { post: savedPost._id, createdAt: Date.now() } }
    });

    res.status(201).json(savedPost);
};


module.exports = {
    createPost,
    getPosts,
    getPostById,
    deletePost,
    sharePost,
};
