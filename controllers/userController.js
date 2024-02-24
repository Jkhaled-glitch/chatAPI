const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const asyncHandler = require('express-async-handler')
const mongoose = require('mongoose');
const downloadFileToServer = require('../config/downloadFileToServer');
const uploadfileMiddleware = require('../config/uploadfileMiddleware')
const User = require('../models/userModel')


// @desc    Register new user
// @route   POST /users/
// @access  Public

const registerUser = asyncHandler(async (req, res) => {
  const { name, lastName, age, email, password, phone, profile } = req.body
  // Check if user exists
  const userExists = await User.findOne({ email })

  if (userExists) {
    res.status(400)
    throw new Error('User already exists')
  }

  // Hash password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  // Create user
  const user = await User.create({
    name,
    lastName,
    age,
    email,
    password: hashedPassword,
    phone,
    profile,
  })

  if (user) {
    res.status(201).json({
      user: user,
      token: generateToken(user._id),
    })
  } else {
    res.status(400)
    throw new Error('Invalid user data')
  }
})


// @desc    Authenticate a user
// @route   POST /users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Check for user email
  const user = await User.findOne({ email })


  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      lastName: user.lastName,
      age: user.age,
      profile: user.profile,
      token: generateToken(user._id),
    })
  } else {
    res.status(400)
    throw new Error('Invalid credentials')
  }

})



// @desc    Get user data
// @route   GET /users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {

  res.status(200).json(req.user)
})

// @desc    Get user by Id
// @route   GET /users/:userId
// @access  Public
const getUserById = asyncHandler(async (req, res) => {
  const userId = req.params.userId

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error('Invalid user ID');
  }
  // Check for userId
  const user = await User.findById(userId)

  if (!user) {
    res.status(404)
    throw new Error('User Not Found!')
  }

  const { _id, name, lastName, age, email, phone, isActive, profile, createdAt, updatedAt } = user

  res.status(200).json({ _id, name, lastName, age, email, phone, profile, isActive, createdAt, updatedAt })
})

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.TOKEN_EXPIREIN,
  })
}



// @desc    upload profile image
// @route   POST /users/profile
// @access  Private

const uploadProfile = asyncHandler(async (req, res) => {
  uploadfileMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    const userId = req.user._id;
    const file = req.file;

    try {
      if (!file) {
        throw new Error('No file to upload')
      }
      const fileUrl = await downloadFileToServer(file, 'profiles'); 
      if (!fileUrl) {
        res.status(400);
        throw new Error("Failed when saving the file");
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.profile.unshift(fileUrl);
      await user.save();

      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
});




// @desc    get profile image
// @route   POST /users/:userId/profile 
// @access  Public

const getProfileImage = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not Found" });
    }
    res.status(200).json({ profileImage: user.profile[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = {
  registerUser,
  loginUser,
  getMe,
  getUserById,
  getProfileImage,
  uploadProfile,
}
