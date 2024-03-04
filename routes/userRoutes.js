const express = require('express')
const router = express.Router()
const {
  registerUser,
  loginUser,
  getMe,
  isUser,
  getUserById,
  uploadProfile,
  getProfileImage,
  updateData,
  updatePassword,
  removeProfile
} = require('../controllers/userController')

const { 
    sendRequest,
    acceptRequest,
    rejectRequest,
    getFriends,
    getRequests,
    getSuggestions,
} = require('../controllers/friendsController')

const { protect } = require('../middleware/authMiddleware')

const postRoutes = require('./postRoutes')

router.post('/', registerUser)
router.post('/login', loginUser)
router.get('/me', protect, getMe)
router.get('/isUser',protect, isUser)
router.put('/updateData',protect,updateData)
router.put('/updatePassword',protect,updatePassword)

router.post("/profile", protect, uploadProfile);
router.put("/removeProfile", protect, removeProfile);

//friends routes
router.post('/sendRequest',protect,sendRequest)
router.get("/getFriends", protect, getFriends);
router.get("/getRequests", protect, getRequests);
router.get("/getSuggestions", protect, getSuggestions);

router.put('/acceptRequest',protect,acceptRequest)
router.put("/rejectRequest", protect, rejectRequest);


//Post Routes 
router.use('/posts',protect,postRoutes)

router.get('/:userId', getUserById)
router.get("/:userId/profile", getProfileImage);










module.exports = router
