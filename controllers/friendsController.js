const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// @desc    Send friend request
// @route   POST /users/sendFriendRequest/:friendId
// @access  Private
const sendRequest = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const friendId = req.params.friendId;
  
    try {
      const user = await User.findById(userId);
      const friend = await User.findById(friendId);
  
      if (!friend) {
        return res.status(404).json({ message: 'Friend not found' });
      }
  
      // Add friendId to user's requestsSent array
      user.friends.requestsSent.push(friendId);

      // Add userId to friend's requestsReceived array
      friend.friends.requestsReceived.push(userId);
      
      await user.save();
      await friend.save();
  
      res.status(200).json({ message: 'Friend request sent successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});

// @desc    Accept friend request
// @route   PUT /users/acceptFriendRequest/:requestId
// @access  Private
const acceptRequest = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const requestId = req.params.requestId;
  
    try {
      const user = await User.findById(userId);
      const friend = await User.findById(requestId);
  
      // Find the friend request in user's requestsReceived array
      const indexRequest = user.friends.requestsReceived.indexOf(requestId);
      if (indexRequest === -1) {
        return res.status(404).json({ message: 'Friend request not found' });
      }

      // Find the user request in friend's requestsSent array
      const indexSent = friend.friends.requestsSent.indexOf(userId);
      if (indexSent === -1) {
        return res.status(404).json({ message: 'Friend request not found' });
      }
  
      // Remove requestId from user's requestsReceived array
      user.friends.requestsReceived.splice(indexRequest, 1);

      // Remove userId from friend's requestsSent array
      friend.friends.requestsSent.splice(indexSent, 1);
  
      // Add requestId to user's friends list
      user.friends.list.push(requestId);
      friend.friends.list.push(userId);
  
      await user.save();
      await friend.save();
  
      res.status(200).json({ message: 'Friend request accepted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});

// @desc    Reject friend request
// @route   PUT /users/rejectFriendRequest/:requestId
// @access  Private
const rejectRequest = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const requestId = req.params.requestId;
  
    try {
      const user = await User.findById(userId);
      const friend = await User.findById(requestId);
  
      // Find the friend request in user's requestsReceived array
      const indexRequest = user.friends.requestsReceived.indexOf(requestId);
      if (indexRequest === -1) {
        return res.status(404).json({ message: 'Friend request not found' });
      }

      // Find the user request in friend's requestsSent array
      const indexSent = friend.friends.requestsSent.indexOf(userId);
      if (indexSent === -1) {
        return res.status(404).json({ message: 'Friend request not found' });
      }
  
      // Remove requestId from user's requestsReceived array
      user.friends.requestsReceived.splice(indexRequest, 1);

      // Remove userId from friend's requestsSent array
      friend.friends.requestsSent.splice(indexSent, 1);
  
      await user.save();
      await friend.save();
  
      res.status(200).json({ message: 'Friend request rejected successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});

// @desc    Get user's friends
// @route   GET /users/friends
// @access  Private
const getFriends = asyncHandler(async (req, res) => {
    const userId = req.user._id;
  
    try {
      const user = await User.findById(userId).populate('friends.list', '_id name lastName email profile');
  
      res.status(200).json( user.friends.list );
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});

// @desc    Get friend requests
// @route   GET /users/friendRequests
// @access  Private
const getRequests = asyncHandler(async (req, res) => {
    const userId = req.user._id;
  
    try {
      const user = await User.findById(userId).populate('friends.requestsReceived', '_id name lastName email profile');
  
      res.status(200).json( user.friends.requestsReceived );
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});

// @desc    Get friend suggestions
// @route   GET /users/friendSuggestions
// @access  Private
const getSuggestions = asyncHandler(async (req, res) => {
    const userId = req.user._id;
  
    try {
        const user = await User.findById(userId).populate('friends.suggestions', '_id name lastName email profile');
    
        res.status(200).json( user.friends.suggestions );
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
});

module.exports = {
    sendRequest,
    acceptRequest,
    rejectRequest,
    getFriends,
    getRequests,
    getSuggestions,
};
