const express = require('express')
const router = express.Router()
const {
    addConversation,
    deleteConversation,
    addParticipant,
    removeParticipant
} = require('../controllers/conversationController')

const { protect } = require('../middleware/authMiddleware')

router.post('/addConversation', protect, addConversation)
router.delete(":conversationId", protect, deleteConversation)
router.put('/:conversationId/addParticipant', protect, addParticipant)
router.put('/:conversationId/removeParticipant', protect, removeParticipant)

module.exports = router
