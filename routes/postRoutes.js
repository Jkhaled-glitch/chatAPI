const express = require('express')
const router = express.Router()
const {
    createPost,
    getPosts,
    getPostById,
    deletePost,
    sharePost,
    addReaction,
    removeReaction
} = require('../controllers/postController')

const commentRoutes = require('./commentRoutes')


router.get('/:postId', getPostById)
router.delete('/:postId', deletePost);
router.post('/:postId/shares', sharePost);
router.put('/:postId/addReaction', addReaction);
router.put('/:postId/removeReaction', removeReaction);
router.post('/', createPost)
router.get('/', getPosts)




//Comment Routes
router.use('/', commentRoutes )

module.exports = router



