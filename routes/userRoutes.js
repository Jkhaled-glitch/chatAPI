const express = require('express')
const router = express.Router()
const {
  registerUser,
  loginUser,
  getMe,
  getUserById,
  uploadProfile,
  getProfileImage
} = require('../controllers/userController')
const { protect } = require('../middleware/authMiddleware')

const postRoutes = require('./postRoutes')

router.post('/', registerUser)
router.post('/login', loginUser)
router.get('/me', protect, getMe)
router.get('/:userId', getUserById)
router.get("/:userId/profile", getProfileImage);


router.post("/profile", protect, uploadProfile);


//Post Routes 
router.use('/posts',protect,postRoutes)




module.exports = router
