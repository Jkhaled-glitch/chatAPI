const express = require('express')
const router = express.Router()
const {
  registerUser,
  loginUser,
  getMe,
  uploadProfile,
  getProfileImage,
  upload
} = require('../controllers/userController')
const { protect } = require('../middleware/authMiddleware')

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/me', protect, getMe)
router.post("/profile", protect, upload.single('profile'), uploadProfile);
router.get("/:userId/profile", getProfileImage);

module.exports = router
