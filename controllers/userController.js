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
    res.status(409)
    throw new Error('User already exists')
  }

  // Hash password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  // Create user
  const newUser = await User.create({
    name,
    lastName,
    age,
    email,
    password: hashedPassword,
    phone,
    profile,
    friends:{
      list : [],
      requests :[],
      waiting :[]
    }
  })

  if (newUser) {
    res.status(201).json({
      token: generateToken(newUser._id),
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
  if(req.user){
    
    const { _id, name, lastName, age, email, phone, isActive, profile,friends, createdAt, updatedAt } = req.user
    res.status(200).json({ _id, name, lastName, age, email, phone, isActive, profile,friends, createdAt, updatedAt })
  }
})


// @desc    verifier if user exist
// @route   GET /users/isUser
// @access  public

const isUser = asyncHandler(async (req, res) => {
  if(req.user){
    res.status(200).json({message:'User Exist'})
  }
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

  const { _id, name, lastName, age, email, phone, isActive, profile,friends, createdAt, updatedAt } = user

  res.status(200).json({ _id, name, lastName, age, email, phone, profile,friends, isActive, createdAt, updatedAt })
})


// @desc    update user Data
// @route   PUT /users/updateData
// @access  Private 
const updateData = asyncHandler(async (req, res) => {

    
  const userId = req.user._id;

  const { name, lastName, phone, email } = req.body;
  try {
  

    const user = await User.findById(userId);
    user.name = name;
    user.lastName = lastName;
    user.phone = phone;
    user.email = email;

    updatedUser = await user.save()

    if(updatedUser){
      return res.status(200).json({ message: 'User updated successfully' });
    }

   else {
     return res.status(400).send({message : 'Failed to update user data!'})
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    update user password
// @route   PUT /users/updateData
// @access  Private 
const updatePassword = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(userId);

    // Verify if the old password is valid
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Old password is not valid' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password
    user.password = hashedPassword;
    const updatedUser = await user.save();

    if (updatedUser) {
      return res.status(200).json({ message: 'Password updated successfully' });
    } else {
      throw new Error('Failed to update password');
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




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

      res.status(201).json({message : "Image Profile added successfully"});
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
});


// @desc    remove profile image
// @route   PUT /users/removeProfile
// @access  Private

const removeProfile = asyncHandler(async (req, res) => {
  
    const userId = req.user._id;

    try {
      const user = await User.findById(userId);
      user.profile.unshift('');
      await user.save();

      res.status(201).json({message : "Image Profile removed successfully"});
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  
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
  isUser,
  getUserById,
  getProfileImage,
  uploadProfile,
  updateData,
  updatePassword,
  removeProfile
}
