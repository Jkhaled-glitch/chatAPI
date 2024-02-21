const express = require('express')
const router = express.Router()
const {
  registerUser,
  loginUser,
  getMe,
  getUserById,
  uploadProfile,
  getProfileImage,
  upload
} = require('../controllers/userController')
const { protect } = require('../middleware/authMiddleware')

const postRoutes = require('./postRoutes')

router.post('/', registerUser)
router.post('/login', loginUser)
router.get('/me', protect, getMe)
router.get('/:userId', getUserById)
router.post("/profile", protect, upload.single('profile'), uploadProfile);
router.get("/:userId/profile", getProfileImage);

//Post Routes 
router.use('/posts',protect,postRoutes)




module.exports = router
