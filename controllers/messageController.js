const asyncHandler = require('express-async-handler')
const Message = require('../models/messageModel')

// @desc    send new message
// @route   POST /:conversationId/message/send
// @access  current user and participant in conversation

const sendMessage = asyncHandler(async (req, res) => {
  const { sender, receivers, type, content, seenBy, deletedFor, status } = req.body
  const conversationId = req.params.conversationId;
  // Create message
  const message = await Message.create({
    sender,
    conversationId: conversationId,
    type,
    content,
    seenBy,
    deletedFor,
    status,
  })

  if (message) {
    res.status(201).json(message)
  } else {
    res.status(400)
    throw new Error('Invalid message data')
  }
});



// @desc    Update message 
// @route   PUT /:convId/message/put/:messageId
// @access  public 

const updateMessage = asyncHandler(async (req, res) => {
  const { seenBy, deletedFor, status } = req.body;
  const messageId = req.params.messageId;
  const userId = req.user._id; // Supposons que vous avez l'ID de l'utilisateur dans req.user._id
  const options = { new: true };

  const updateFields = {};
  updateFields.$addToSet = { seenBy: { $each: seenBy } };
  updateFields.$addToSet = { deletedFor: { $each: deletedFor } };

  if (status && status === "removed") {
    // Vérifier si l'utilisateur est l'expéditeur du message
    const message = await Message.findOne({ _id: messageId, sender: userId });

    if (!message) {
      res.status(403);
      throw new Error('Unauthorized: Only the sender can remove the message');
    }
    updateFields.status = "removed";
  }

  const updatedMessage = await Message.findOneAndUpdate(
    { _id: messageId },
    updateFields,
    options
  );

  if (updatedMessage) {
    res.status(200).json(updatedMessage);
  } else {
    res.status(400);
    throw new Error('Failed to update message');
  }
});


// @desc    delete all message from conversation
// @route   DELETE /:convId/message/deleteAllMessageFromConversation
// @access  public 

const deleteAllMessageFromConversation = asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId;


  const deletedMessages = await Message.deleteMany({ conversation: conversationId });

  if (deletedMessages) {
    res.status(200).json({ message: 'All messages from the conversation deleted successfully' });
  } else {
    res.status(400);
    throw new Error('Failed to delete messages from the conversation');
  }
});





module.exports = {
  sendMessage,
  updateMessage,
  deleteAllMessageFromConversation
}
