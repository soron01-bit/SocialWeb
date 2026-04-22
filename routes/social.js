const express = require('express');
const { protect } = require('../middleware/auth');
const {
  listUsers,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  getFriends,
  getFriendsPresence,
  presenceHeartbeat,
  getMessagesWithFriend,
  sendMessageToFriend,
  reactToMessage,
  deleteMessage,
  createPost,
  getFeed,
  getAllFeed,
  deletePost,
  editPost,
  toggleLike,
  addComment
} = require('../controllers/socialController');

const router = express.Router();

router.use(protect);

router.get('/users', listUsers);
router.get('/friend-requests', getFriendRequests);
router.post('/friend-request', sendFriendRequest);
router.post('/friend-request/accept', acceptFriendRequest);
router.get('/friends', getFriends);
router.get('/presence/friends', getFriendsPresence);
router.post('/presence/heartbeat', presenceHeartbeat);
router.get('/messages/:friendId', getMessagesWithFriend);
router.post('/messages/:friendId', sendMessageToFriend);
router.post('/messages/:friendId/:messageId/reaction', reactToMessage);
router.delete('/messages/:friendId/:messageId', deleteMessage);
router.post('/posts', createPost);
router.get('/feed', getFeed);
router.get('/feed/all', getAllFeed);
router.delete('/posts/:postId', deletePost);
router.put('/posts/:postId', editPost);
router.post('/posts/:postId/like', toggleLike);
router.post('/posts/:postId/comments', addComment);

module.exports = router;
