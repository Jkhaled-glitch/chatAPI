const express = require('express')

const router = express.Router()
const {
    sendMessage,
    getAllMessagesFromConversation,
    updateMessage
} = require('../controllers/messageController')

router.post('/:conversationId/message/send', sendMessage);
router.get('/:conversationId/messages',getAllMessagesFromConversation)
router.put('/:conversationId/message/:messageId', updateMessage)

module.exports = router