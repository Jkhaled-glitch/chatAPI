const mongoose = require('mongoose')

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    age: {
      type: Number,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is invalid email!`
      }
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\+?[0-9]{8,13}$/.test(v);
        },
        message: props => `${props.value} is invalid phone number!`
      }
    },
    friends: {
      list: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      requestsSent: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      requestsReceived: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    password: {
      type: String,
      required: true
    },
    profile: [{
      type: String,
    }]
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('User', userSchema)
