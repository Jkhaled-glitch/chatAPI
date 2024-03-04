const express = require('express')

const router = express.Router()
const {
    addConversation,
    getAllConversations,
    deleteConversation,
    addParticipant,
    removeParticipant
} = require('../controllers/conversationController')
messageRoutes = require('./messageRoutes')


router.post('/addConversation', addConversation)
router.get('/getAllConversations', getAllConversations)
router.delete("/:conversationId",  deleteConversation)
router.put('/:conversationId/addParticipant', addParticipant)
router.put('/:conversationId/removeParticipant',  removeParticipant)



// Message Routes
router.use('/', messageRoutes);


module.exports = router
