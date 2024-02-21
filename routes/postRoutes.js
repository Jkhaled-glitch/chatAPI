const express = require('express')
const router = express.Router()
const {
    createPost,
    getPosts,
    getPostById,
    deletePost,
    sharePost,
} = require('../controllers/postController')

const commentRoutes = require('./commentRoutes')


router.post('/', createPost)
router.get('/', getPosts)
router.get('/:postId', getPostById)
router.delete('/:postId', deletePost);
router.post('/:postId/shares', sharePost);

//Comment Routes
router.use('/', commentRoutes )

module.exports = router



