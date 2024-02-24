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
            }

            // Détermination du type en fonction du mimetype
            type = file.mimetype.startsWith('image/') ? 'image' : 'file';

            // Téléchargement du fichier et mise à jour du contenu
            content = await downloadFileToServer(file, type);
          }

        }
      }

      // Création du message pour les types autres que 'file', 'image' ou 'text'

      const message = await Message.create({
        sender: sender,
        conversationId: conversationId,
        type: type,
        content: content,
        seenBy: [],
        deletedFor: [],
      });

      // Mise à jour de la conversation
      await Conversation.findOneAndUpdate(
        { _id: conversationId },
        { $push: { messages: { $each: [message._id], $position: 0 } } },
        { new: true }
      );

      // Envoi de la réponse avec le message créé
      res.status(201).json(message);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
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

    const filenames = messages.filter(message => message.type === 'file' ).map(message => {
      
      const filenameRegex = /\/([^/]+)$/;
      const match = filenameRegex.exec(message.content);
      if (match && match.length > 1) {
        return match[1]; 
      }
      return null;
    }).filter(filename => filename !== null);

    const imagenames = messages.filter( message => message.type === 'image').map(message => {
      
      const filenameRegex = /\/([^/]+)$/;
      const match = filenameRegex.exec(message.content);
      if (match && match.length > 1) {
        return match[1]; 
      }
      return null;
    }).filter(filename => filename !== null);
     
    console.log(filenames)
    console.log(imagenames)
     //delete all files and images for the conversation
   filenames.length!=0 && await deleteFilesFromStorage(`files`,filenames)
   imagenames.length!=0 && await deleteFilesFromStorage(`images`,imagenames)

  //delete all messages data for the conversation
  const deletedMessages = await Message.deleteMany({ conversation: conversationId });

    if (deletedMessages) {
      res.status(200).json({ message: 'All messages from the conversation deleted successfully', deletedMessages: messagesInfo });
    } else {
      res.status(400);
      throw new Error('Failed to delete messages from the conversation');
    }
    
  } catch (error) {
    throw new Error('Failed to delete messages from the conversation:'+ error.message );
  }
}


module.exports = {
  sendMessage,
  updateMessage,
  deleteAllMessageFromConversation
}
