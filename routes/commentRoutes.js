const express = require('express')

const router = express.Router()
const {
    createComment,
    deleteComment,
    addReaction,
    removeReaction,
    getAllCommentsForPost
    
} = require('../controllers/commentController')

// Cette route doit inclure le paramètre postId
router.get('/:postId/comments', getAllCommentsForPost);
//router.get('', getAllCommentsForPost)
router.post('/:postId/comments', createComment);
router.delete('/:postId/comments/:commentId', deleteComment)
router.put('/:postId/comments/:commentId/addReaction', addReaction)
router.put('/:postId/comments/:commentId/removeReaction', removeReaction)


module.exports = router