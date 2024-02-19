const asyncHandler = require('express-async-handler')
const messageController = require('../controllers/messageController');
const Conversation = require('../models/conversationModel');

// @desc    add new conversation
// @route   POST /conversation/addConversation
// @access  current user

const addConversation = asyncHandler(async (req, res) => {
  const { participants, type } = req.body;
  const userId = req.user._id;

  participants.unshift(userId);

  // Vérifier le type de conversation et le nombre de participants
  if ((type === 'individual' && participants.length > 1) ||
    (type === 'private' && participants.length !== 2) ||
    (type === 'group' && participants.length < 2)) {
    res.status(400);
    throw new Error('Invalid combination of conversation type and participants');
  }



  const conversation = await Conversation.create({
    participants,
    type
  });

  if (conversation) {
    res.status(201).json(conversation);
  } else {
    res.status(400);
    throw new Error('Invalid conversation data');
  }
});



// @desc    delete conversation
// @route   DELETE /conversation/:conversationId
// @access  user creator of conversation

const deleteConversation = asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId;
  const userId = req.user._id;


  const conversation = await Conversation.findOne({ _id: conversationId });

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }


  if (conversation.participants[0].toString() !== userId.toString() && conversation.type === "group") {
    res.status(403);
    throw new Error('Unauthorized: Only the creator can delete the conversation');
  }

  //delete all messages of this conversation  
  await messageController.deleteAllMessageFromConversation(conversationId);
  //delete the conversation
  const deletedConversation = await Conversation.findByIdAndDelete(conversationId);

  if (deletedConversation) {
    res.status(200).json({ message: 'Conversation deleted successfully' });
  } else {
    res.status(400);
    throw new Error('Failed to delete conversation');
  }
});



// @desc    leave participant to conversation
// @route   PUT /conversation/:conversationId/removeParticipant
// @access  user  if participant and  not the  creator

const removeParticipant = asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId;
  const userId = req.user._id;


  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }


  if (conversation.participants[0].toString() === userId.toString()) {
    res.status(403);
    throw new Error('Unauthorized: Cannot remove the first participant from the conversation');
  }


  const participantIndex = conversation.participants.findIndex(participant => participant.toString() === userId.toString());

  if (participantIndex === -1) {
    res.status(403);
    throw new Error('Unauthorized: User is not a participant of the conversation');
  }


  conversation.participants.splice(participantIndex, 1);
  const updatedConversation = await conversation.save();

  if (updatedConversation) {
    res.status(200).json({ message: 'User removed from the conversation successfully' });
  } else {
    res.status(400);
    throw new Error('Failed to remove user from the conversation');
  }
});

// @desc    leave participant to conversation
// @route   PUT /conversation/:conversationId/addParticipant
// @access  user  if participant and  not the  creator

const addParticipant = asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId;
  const newMemberId = req.body.newMemberId; // Supposons que vous envoyez le nouvel ID de membre dans le corps de la requête

  // Rechercher la conversation
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  const userId = req.user._id; // Supposons que vous avez l'ID de l'utilisateur dans req.user._id

  // Vérifier si l'utilisateur est autorisé à ajouter un membre à la conversation
  if (conversation.participants[0].toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Unauthorized: Only the first participant can add a member to the conversation');
  }

  // Ajouter le nouveau membre à la liste des participants de la conversation
  conversation.participants.push(newMemberId);
  const updatedConversation = await conversation.save();

  if (updatedConversation) {
    res.status(200).json({ message: 'New member added to the conversation successfully' });
  } else {
    res.status(400);
    throw new Error('Failed to add new member to the conversation');
  }
});



module.exports = {
  addConversation,
  deleteConversation,
  addParticipant,
  removeParticipant
}
