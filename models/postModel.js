const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contentType: {
        type: String,
        enum: ['text', 'image', 'video', 'mixed'],
        required: true
    },
    contentText: {
        type: String
    },
    contentUrl: {
        type: String
    },
    contentFiles: [{
        type: String
    }],
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        type: {
            type: String,
            enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
            required: true
        }
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    shares: [{
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    shared: {
        isShared: {
            type: Boolean,
            default: false
        },
        originalPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post'
        }
    }
}, {
    timestamps: true
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
