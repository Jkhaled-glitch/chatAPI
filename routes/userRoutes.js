const express = require('express')
const router = express.Router()
const {
  registerUser,
  loginUser,
  getMe,
  isUser,
  getUserById,
  uploadProfile,
  getProfileImage
} = require('../controllers/userController')
const { protect } = require('../middleware/authMiddleware')

const postRoutes = require('./postRoutes')

router.post('/', registerUser)
router.post('/login', loginUser)
router.get('/me', protect, getMe)
router.get('/isUser',protect, isUser)

//Post Routes 
router.use('/posts',protect,postRoutes)

router.get('/:userId', getUserById)
router.get("/:userId/profile", getProfileImage);


router.post("/profile", protect, uploadProfile);







module.exports = router
