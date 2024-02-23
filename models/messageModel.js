// Require Mongoose
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'file', 'url','image'],
    default: 'text',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  seenBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['normal', 'removed'],
    default: 'normal'
  },

},
  {
    timestamps: true,
  });




// Create the Message model
const Message = mongoose.model('Message', messageSchema);

// Export the Message model
module.exports = Message;
