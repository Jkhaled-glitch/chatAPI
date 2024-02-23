const mongoose = require('mongoose')
const asyncHandler = require('express-async-handler')

const Message = require('../models/messageModel')
const Conversation = require('../models/conversationModel');
const downloadFileToServer = require('../config/downloadFileToServer');
const uploadfileMiddleware = require('../config/uploadfileMiddleware')


// @desc    send new message
// @route   POST /conversations/:conversationId/message/send
// @access  current user and participant in conversation
/*
const sendMessage = asyncHandler(async (req, res) => {
  const { type, content } = req.body;
  const sender = req.user._id;
  const conversationId = req.params.conversationId;

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json({message :'Invalid conversation ID'})
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({message :'Conversation not found'})
  }

  const isUserParticipant = conversation.participants.some(participant => participant.equals(sender));
  if (!isUserParticipant) {
    return res.status(403).json({message :'Sender is not a participant of this conversation'})
    
  }

  if (!type || type === 'text') {
    if (!content || content.length == 0) {
      return res.status(400).json({message :'Content cannot be empty'})
    }
  }

  if (type === 'url') {
    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
    if (!urlRegex.test(content)) {
      return res.status(400).json({message :'Invalid URL'})
    }
  }

  if (type === 'file' || type === 'image') {
    upload.single(type.toString())(req, res, async function (err) {
      if (err) {
        return res.status(400).json({message :`Failed to upload ${type}`})
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({message :'No file uploaded'})
      }

      let uploadedFileUrl;

      type = file.mimetype.startsWith('image/') ? 'image' : 'file';

      uploadedFileUrl = await uploadFile(file, { type });
      if (!uploadedFileUrl) {
        return res.status(400).json({message :'Failed to upload file'})
        
      }
      content = uploadedFileUrl;
    });
  }

  // Créer le message
  const message = await Message.create({
    sender: sender,
    conversationId: conversationId,
    type,
    content,
    seenBy: [],
    deletedFor: [],
  });

  if (message) {
    // Mettre à jour la conversation
    await Conversation.findOneAndUpdate(
      { _id: conversationId },
      { $push: { messages: { $each: [message._id], $position: 0 } } },
      { new: true }
    );

    res.status(201).json(message);
  } else {
    
  res.status(400).json({message :'Invalid message data'})
  }
});
*/



const sendMessage = asyncHandler(async (req, res) => {
  //upload  file 
  uploadfileMiddleware(req, res, async (err) => {
    try {
      if (err) {
       if(type&& type==='file' || type==='image')
        throw new Error(err.message);
      }

      let { type, content } = req.body;

      console.log(req.body)

      const sender = req.user._id;
      const conversationId = req.params.conversationId;

      // Vérification de la validité de l'ID de conversation
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }

      // Recherche de la conversation
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Vérification si l'utilisateur est participant de la conversation
      const isUserParticipant = conversation.participants.some(participant => participant.equals(sender));
      if (!isUserParticipant) {
        return res.status(403).json({ message: 'Sender is not a participant of this conversation' });
      }

      // Vérification du contenu en fonction du type
      if (!type || type === 'text' || type ==='') {
        if (!content || content.length == 0) {
          return res.status(400).json({ message: 'Content cannot be empty' });
        }
      } else if (type === 'url') {
        const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
        if (!urlRegex.test(content)) {
          return res.status(400).json({ message: 'Invalid URL' });
        }
      } else if (type === 'file' || type === 'image') {

        const file = req.file;
        if (!file) {
          throw new Error('No file uploaded');
        }

        // Détermination du type en fonction du mimetype
        type = file.mimetype.startsWith('image/') ? 'image' : 'file';

        // Téléchargement du fichier et mise à jour du contenu
        content = await downloadFileToServer(file, type);
      }

      // Création du message pour les types autres que 'file', 'image' ou 'text'
  
      const message = await Message.create({
        sender: sender,
        conversationId: conversationId,
        type:type,
        content:content,
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
