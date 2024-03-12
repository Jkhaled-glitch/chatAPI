const mongoose = require('mongoose')
const asyncHandler = require('express-async-handler')

const Message = require('../models/messageModel')
const Conversation = require('../models/conversationModel');
const downloadFileToServer = require('../config/downloadFileToServer');
const uploadfileMiddleware = require('../config/uploadfileMiddleware')
const deleteFilesFromStorage = require('../config/deleteFilesFromStorage')
// @desc    send new message
// @route   POST /conversations/:conversationId/message/send
// @access  current user and participant in conversation

const sendMessage = asyncHandler(async (req, res) => {
  uploadfileMiddleware(req, res, async (err) => {
    try {
      if (err) {
        if (type && type === 'file' || type === 'image')
          throw new Error(err.message);
      }

      let { type, content } = req.body;

      const sender = req.user._id;
      const conversationId = req.params.conversationId;

      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      const isUserParticipant = conversation.participants.some(participant => participant.equals(sender));
      if (!isUserParticipant) {
        return res.status(403).json({ message: 'Sender is not a participant of this conversation' });
      }

      if (!type || type === 'text' || type === '') {
        type = 'text'
        if (!content || content.length == 0) {
          return res.status(400).json({ message: 'Content cannot be empty' });
        }
      } else {
        if (type === 'url') {
          const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
          if (!urlRegex.test(content)) {
            return res.status(400).json({ message: 'Invalid URL' });
          }
        } else {
          if (type === 'file' || type === 'image') {
            const file = req.file;
            if (!file) {
              throw new Error('No file uploaded');
            } else {
              //file handler
              type = file.mimetype.startsWith('image/') ? 'image' : 'file';
              content = await downloadFileToServer(file, type);
            }
          } else {
            throw new Error('Type is Not Valide');
          }
        }
      }

      const message = await Message.create({
        sender: sender,
        conversationId: conversationId,
        type: type,
        content: content,
        seenBy: [],
        deletedFor: [],
      });

      // Mise à jour de la conversation
      const upadatedconversation = await Conversation.findOneAndUpdate(
        { _id: conversationId },
        { $push: { messages: { $each: [message._id], $position: 0 } } },
        { new: true }
      )
      // use io to emit message
      const io = req.io;
      io.emit('message', message);
      res.status(201).send(message);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
});


// @desc    Get all messages from a conversation sorted by createdAt
// @route   GET /conversations/:conversationId/messages
// @access  Private (since you're getting messages from a conversation, it should be private)

const getAllMessagesFromConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversation ID' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Ensure the current user is a participant in the conversation
    const userId = req.user._id;
    const isUserParticipant = conversation.participants.some(participant => participant.equals(userId));
    if (!isUserParticipant) {
      return res.status(403).json({ message: 'User is not a participant of this conversation' });
    }

    // Retrieve messages from the conversation and sort them by createdAt in descending order
    const messages = await Message.find({ conversationId }).sort({ createdAt: -1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
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



const deleteAllMessageFromConversation = async (conversationId) => {

  try {
    const messages = await Message.find({ conversation: conversationId });

    const filenames = messages.filter(message => message.type === 'file').map(message => {

      const filenameRegex = /\/([^/]+)$/;
      const match = filenameRegex.exec(message.content);
      if (match && match.length > 1) {
        return match[1];
      }
      return null;
    }).filter(filename => filename !== null);

    const imagenames = messages.filter(message => message.type === 'image').map(message => {

      const filenameRegex = /\/([^/]+)$/;
      const match = filenameRegex.exec(message.content);
      if (match && match.length > 1) {
        return match[1];
      }
      return null;
    }).filter(filename => filename !== null);

    //delete all files and images for the conversation
    filenames.length != 0 && await deleteFilesFromStorage(`files`, filenames)
    imagenames.length != 0 && await deleteFilesFromStorage(`images`, imagenames)

    //delete all messages data for the conversation
    await Message.deleteMany({ conversation: conversationId });

  } catch (error) {
    throw new Error('Failed to delete messages from the conversation:' + error.message);
  }
}


module.exports = {
  sendMessage,
  getAllMessagesFromConversation,
  updateMessage,
  deleteAllMessageFromConversation
}
