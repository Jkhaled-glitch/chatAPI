const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const multer = require('multer');
const asyncHandler = require('express-async-handler')
const mongoose = require('mongoose');
const User = require('../models/userModel')


// @desc    Register new user
// @route   POST /users/
// @access  Public

const registerUser = asyncHandler(async (req, res) => {
  const { name, lastName, age, email, password,phone, profile } = req.body
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
      user:user,
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

  const {_id,name,lastName,age,email,phone,isActive,profile , createdAt,updatedAt} = user

  res.status(200).json({_id,name,lastName,age,email,phone,profile, isActive , createdAt,updatedAt})
})

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.TOKEN_EXPIREIN,
  })
}



// @desc    upload profile image
// @route   POST /users/:userId/profile
// @access  Private

const uploadProfile = async (req, res) => {
  const userId = req.user._id;
  const profile = req.file;
  try {
    // Rechercher l'utilisateur par son ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Sauvegarder le chemin de l'image de profil dans le document de l'utilisateur
    user.profile.unshift(profile.path);
    await user.save();

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    get profile image
// @route   POST /users/:userId/profile 
// @access  Public

const getProfileImage = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Obtenir l'URL de base de l'API à partir de req
    const baseUrl = req.protocol + '://' + req.get('host');

    // Renvoyer l'URL complète de l'image de profil
    const profileImageUrl = baseUrl + '/' + user.profile[0].replace(/\\/g, '/');
    res.status(200).json({ profileImage: profileImageUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


//storage for images profiles
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getUserById,
  getProfileImage,
  uploadProfile,
  upload
}
