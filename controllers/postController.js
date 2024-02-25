const asyncHandler = require('express-async-handler');
const Post = require('../models/postModel');
const Comments = require('../models/commentModel');
const downloadFileToServer = require('../config/downloadFileToServer');
const uploadfileMiddleware = require('../config/uploadfileMiddleware');
const deleteFilesFromStorage = require('../config/deleteFilesFromStorage');

// @desc    create new post
// @route   POST /users/posts
// @access  Private
const createPost = asyncHandler(async (req, res) => {
    uploadfileMiddleware(req, res, async (err) => {
        try {
            if (err) {
                if (contentType && contentType === 'image' || contentType === 'mixed')
                    throw new Error(err.message);
            }

            const user = req.user;
            let { contentType, contentText, contentUrl } = req.body;

            if (!contentType || contentType === 'text' || contentType === '') {
                contentType = 'text'
                if (!contentText || contentText.length == 0) {
                    return res.status(400).json({ message: 'ContentText cannot be empty' });
                }
            } else {
                if (contentType === 'url') {
                    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
                    if (!urlRegex.test(contentUrl)) {
                        return res.status(400).json({ message: 'Invalid URL' });
                    }
                } else {
                    if (contentType === 'image' || contentType === 'mixed') {
                        const file = req.file;
                        if (!file) {
                            throw new Error('No image uploaded');
                        }

                        //file handler
                        contentFiles = await downloadFileToServer(file, 'images');


                    } else {
                        throw new Error('ContentType is Not Valide');

                    }
                }

                const post = await Post.create({
                    user: user._id,
                    contentType,
                    contentText,
                    contentUrl,
                    contentFiles,
                    reactions: [],
                    comments: [],
                    shares: [],
                });

                if (!post) {
                    throw new Error('Invalid post data');

                }
                //success
                res.status(201).json(post);
            }
        } catch (err) {
            res.status(400).json({ message: err.message })
        }
    })
});



// @desc    get all user posts
// @route   GET /users/posts
// @access  public
const getPosts = asyncHandler(async (req, res) => {
    
    //const user = req.user;
    const posts = await Post.find();
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
    try {
        const postId = req.params.postId;
        const post = await Post.findById(postId);

        if (!post) {
            res.status(404);
            throw new Error('Post Not found');
        }

        if (post.user.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Unauthorized: Only the creator can delete the post');
        }

        await Comments.deleteMany({ post: postId });

        if (post.contentType === 'image' || post.contentType === 'mixed') {
            const filenameRegex = /\/([^/]+)$/;
            const match = filenameRegex.exec(post.contentFiles);
            if (match && match.length > 1) {
                let imagename = [];
                imagename.push(match[1]);
                await deleteFilesFromStorage(`images`, imagename);
            }
        }

        await post.remove();
        res.json({ message: 'Post has been deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete post', error: error.message });
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

// @desc    add reaction to a post
// @route   PUT /users/posts/:postId/addReaction
// @access  Private
const addReaction = asyncHandler(async (req, res) => {
    const { type } = req.body;
    const userId = req.user._id;
    const postId = req.params.postId;

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    // Add reaction to the reactions array
    // Check if the user has already reacted
    const existingReaction = post.reactions.find(reaction => reaction.user.toString() === userId.toString());

    if (existingReaction) {
        existingReaction.type = type;
    } else {
        post.reactions.push({
            user: userId,
            type
        });
    }

    await post.save();
    res.status(200).json({ message: 'Reaction added successfully' });
});





// @desc    remove reaction to a post
// @route   PUT users/posts/:postId/removeReaction
// @access  Private

const removeReaction = asyncHandler(async (req, res) => {
    const  userId  = req.user._id;
    const postId = req.params.postId;

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }
    // Find the index of the reaction in the reactions array
    const reactionIndex = post.reactions.findIndex(reaction => reaction.user.toString() === userId.toString());

    // Check if the reaction exists in the comment
    if (reactionIndex === -1) {
        res.status(200);
        throw new Error('Reaction not found');
    }

    // Remove the reaction from the reactions array
    post.reactions.splice(reactionIndex, 1);
      
    // Save the updated comment
    await post.save();
    res.status(200).json({ message: 'Reaction removed successfully' });
});


module.exports = {
    createPost,
    getPosts,
    getPostById,
    deletePost,
    sharePost,
    addReaction,
    removeReaction
};
