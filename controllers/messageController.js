const mongoose = require('mongoose')
const asyncHandler = require('express-async-handler')
const Message = require('../models/messageModel')
const Conversation = require('../models/conversationModel')


// @desc    send new message
// @route   POST /conversations/:conversationId/message/send
// @access  current user and participant in conversation

const sendMessage = asyncHandler(async (req, res) => {
  const { type, content } = req.body
  const sender = req.user._id;
  const conversationId = req.params.conversationId;


  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    res.status(400);
    throw new Error('Invalid conversation ID');
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not Found');
  }
  const isUserParticipant = conversation.participants.some(participant => participant.equals(sender));
  if (!isUserParticipant) {
    res.status(403);
    throw new Error('Sender are not a participant of this conversation');
  }
  // Create message
  const message = await Message.create({
    sender: sender,
    conversationId: conversationId,
    type,
    content,
    seenBy: [],
    deletedFor: [],
  })

  if (message) {
    //update conversation
    await Conversation.findOneAndUpdate(
      { _id: conversationId },
      { $push: { messages: { $each: [message._id], $position: 0 } } },
      { new: true }
    );

    res.status(201).json(message)
  } else {
    res.status(400)
    throw new Error('Invalid message data')
  }
});



// @desc    Update message 
// @route   PUT /conversations/:conversationId/message/:messageId
// @access  public 

const updateMessage = asyncHandler(async (req, res) => {
  const { seenBy, deletedFor, status } = req.body;
  const userId = req.user._id;
  const { conversationId, messageId } = req.params;

  const options = { new: true };

  let hasData = false;

  const updateFields = {};




  const message = await Message.findOne({ _id: messageId, conversationId });

  if (!message) {
    res.status(404);
    throw new Error('Message not found in the conversation');
  }
  const conversation = Conversation.findById(conversationId)

  if (seenBy && seenBy.length > 0) {
    for (const participantId of seenBy) {
      if (!conversation.participants.includes(participantId)) {
        res.status(400);
        throw new Error(`Participant ${participantId} is not in the conversation`);
      }
    }
    updateFields.$addToSet = { seenBy: { $each: seenBy } };
    hasData = true;
  }

  if (deletedFor && deletedFor.length > 0) {
    for (const participantId of deletedFor) {
      if (!conversation.participants.includes(participantId)) {
        res.status(400);
        throw new Error(`Participant ${participantId} is not in the conversation`);
      }
    }
    updateFields.$addToSet = { deletedFor: { $each: deletedFor } };
    hasData = true;
  }
  if (status) {
    if (status === "removed") {
      if (message.sender !== userId) {
        res.status(403);
        throw new Error('Unauthorized: Only the sender can remove the message');
      }
      updateFields.status = "removed";
    } else {
      res.status(400);
      throw new Error('Invalid status Data');
    }
    hasData = true;
  }

  if (!hasData) {
    res.status(400);
    throw new Error('Data is required to set message');
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
// @route   DELETE /:conversationId/message/deleteAllMessageFromConversation
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
