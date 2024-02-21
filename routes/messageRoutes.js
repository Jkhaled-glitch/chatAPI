const express = require('express')

const router = express.Router()
const {
    sendMessage,
    updateMessage
} = require('../controllers/messageController')



router.post('/:conversationId/message/send', sendMessage);
router.put('/:conversationId/message/:messageId', updateMessage)


module.exports = router