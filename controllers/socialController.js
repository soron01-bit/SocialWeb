const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');

function canInteractWithPost(currentUser, post) {
  return post.authorId === currentUser.id || currentUser.friends.includes(post.authorId);
}

function toPublicPost(post, currentUserId) {
  const author = User.findById(post.authorId);
  const comments = (post.comments || []).map((comment) => {
    const commentUser = User.findById(comment.userId);
    return {
      ...comment,
      user: {
        id: commentUser ? commentUser.id : comment.userId,
        name: commentUser ? commentUser.name : 'Unknown',
        username: commentUser ? commentUser.username : 'unknown',
        photo: commentUser ? commentUser.photo : null
      }
    };
  });

  return {
    ...post,
    author: {
      id: author ? author.id : post.authorId,
      name: author ? author.name : 'Unknown',
      username: author ? author.username : 'unknown',
      photo: author ? author.photo : null
    },
    likesCount: Array.isArray(post.likes) ? post.likes.length : 0,
    likedByCurrentUser: Array.isArray(post.likes) ? post.likes.includes(currentUserId) : false,
    canDelete: post.authorId === currentUserId,
    comments
  };
}

exports.listUsers = (req, res) => {
  const currentUser = User.findByIdWithPassword(req.user.userId);

  if (!currentUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const users = User.getAll()
    .filter((user) => user.id !== currentUser.id)
    .map((user) => {
      let relationship = 'none';

      if (currentUser.friends.includes(user.id)) {
        relationship = 'friend';
      } else if (currentUser.friendRequestsSent.includes(user.id)) {
        relationship = 'request_sent';
      } else if (currentUser.friendRequestsReceived.includes(user.id)) {
        relationship = 'requested_you';
      }

      return {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        photo: user.photo,
        relationship
      };
    });

  return res.status(200).json({ success: true, users });
};

exports.sendFriendRequest = (req, res) => {
  const { toUserId } = req.body;

  if (!toUserId) {
    return res.status(400).json({ success: false, message: 'toUserId is required' });
  }

  const result = User.sendFriendRequest(req.user.userId, toUserId);

  if (!result.ok) {
    return res.status(400).json({ success: false, message: result.message });
  }

  return res.status(200).json({ success: true, message: 'Friend request sent' });
};

exports.getFriendRequests = (req, res) => {
  const currentUser = User.findByIdWithPassword(req.user.userId);

  if (!currentUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const requests = currentUser.friendRequestsReceived
    .map((fromUserId) => User.findById(fromUserId))
    .filter(Boolean);

  return res.status(200).json({ success: true, requests });
};

exports.acceptFriendRequest = (req, res) => {
  const { fromUserId } = req.body;

  if (!fromUserId) {
    return res.status(400).json({ success: false, message: 'fromUserId is required' });
  }

  const result = User.acceptFriendRequest(req.user.userId, fromUserId);

  if (!result.ok) {
    return res.status(400).json({ success: false, message: result.message });
  }

  return res.status(200).json({ success: true, message: 'Friend request accepted' });
};

exports.getFriends = (req, res) => {
  const currentUser = User.findByIdWithPassword(req.user.userId);

  if (!currentUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const friends = currentUser.friends
    .map((friendId) => User.findById(friendId))
    .filter(Boolean)
    .map((friend) => ({
      id: friend.id,
      name: friend.name,
      username: friend.username,
      email: friend.email,
      photo: friend.photo
    }));

  return res.status(200).json({ success: true, friends });
};

exports.getMessagesWithFriend = (req, res) => {
  const { friendId } = req.params;
  const currentUser = User.findByIdWithPassword(req.user.userId);

  if (!currentUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (!friendId) {
    return res.status(400).json({ success: false, message: 'friendId is required' });
  }

  if (!currentUser.friends.includes(friendId)) {
    return res.status(403).json({ success: false, message: 'You can only message friends' });
  }

  const friend = User.findById(friendId);
  if (!friend) {
    return res.status(404).json({ success: false, message: 'Friend not found' });
  }

  const messages = Message.getConversation(currentUser.id, friendId).map((message) => ({
    ...message,
    fromSelf: message.fromUserId === currentUser.id
  }));

  return res.status(200).json({
    success: true,
    friend: {
      id: friend.id,
      name: friend.name,
      username: friend.username,
      photo: friend.photo
    },
    messages
  });
};

exports.sendMessageToFriend = (req, res) => {
  const { friendId } = req.params;
  const { text } = req.body;
  const currentUser = User.findByIdWithPassword(req.user.userId);

  if (!currentUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (!friendId) {
    return res.status(400).json({ success: false, message: 'friendId is required' });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Message text is required' });
  }

  if (text.trim().length > 1000) {
    return res.status(400).json({ success: false, message: 'Message is too long (max 1000 chars)' });
  }

  if (!currentUser.friends.includes(friendId)) {
    return res.status(403).json({ success: false, message: 'You can only message friends' });
  }

  const friend = User.findById(friendId);
  if (!friend) {
    return res.status(404).json({ success: false, message: 'Friend not found' });
  }

  const message = Message.send(currentUser.id, friendId, text.trim());

  return res.status(201).json({
    success: true,
    message: {
      ...message,
      fromSelf: true
    }
  });
};

exports.createPost = (req, res) => {
  const { content, photo } = req.body;

  const author = User.findById(req.user.userId);

  if (!author) {
    return res.status(404).json({ success: false, message: 'User not found. Please sign in again.' });
  }

  const normalizedContent = (content || '').trim();
  const normalizedPhoto = photo || null;

  if (!normalizedContent && !normalizedPhoto) {
    return res.status(400).json({ success: false, message: 'Post text or photo is required' });
  }

  if (normalizedContent.length > 500) {
    return res.status(400).json({ success: false, message: 'Post content is too long (max 500 chars)' });
  }

  const post = Post.create(req.user.userId, normalizedContent, normalizedPhoto);

  return res.status(201).json({
    success: true,
    post: {
      ...post,
      author: {
        id: author.id,
        name: author.name,
        username: author.username,
        photo: author.photo
      }
    }
  });
};

exports.getFeed = (req, res) => {
  const currentUser = User.findByIdWithPassword(req.user.userId);

  if (!currentUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const feed = Post.getFeedForUser(currentUser.id, currentUser.friends)
    .map((post) => toPublicPost(post, currentUser.id));

  return res.status(200).json({ success: true, feed });
};

exports.getAllFeed = (req, res) => {
  const currentUser = User.findByIdWithPassword(req.user.userId);

  if (!currentUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const feed = Post.getFeedForUser(currentUser.id, currentUser.friends)
    .map((post) => toPublicPost(post, currentUser.id));

  return res.status(200).json({ success: true, feed });
};

exports.deletePost = (req, res) => {
  const { postId } = req.params;
  const currentUser = User.findByIdWithPassword(req.user.userId);

  if (!currentUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const post = Post.findById(postId);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  if (post.authorId !== currentUser.id) {
    return res.status(403).json({ success: false, message: 'You can delete only your own posts' });
  }

  const result = Post.deleteById(postId);
  if (!result.ok) {
    return res.status(400).json({ success: false, message: result.message || 'Could not delete post' });
  }

  return res.status(200).json({ success: true, message: 'Post deleted successfully' });
};

exports.editPost = (req, res) => {
  const { postId } = req.params;
  const { content, photo, removePhoto } = req.body;
  const currentUser = User.findByIdWithPassword(req.user.userId);

  if (!currentUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const post = Post.findById(postId);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  if (post.authorId !== currentUser.id) {
    return res.status(403).json({ success: false, message: 'You can edit only your own posts' });
  }

  const normalizedContent = (content || '').trim();
  let nextPhoto = post.photo || null;

  if (removePhoto) {
    nextPhoto = null;
  }

  if (typeof photo === 'string' && photo.trim()) {
    nextPhoto = photo;
  }

  if (!normalizedContent && !nextPhoto) {
    return res.status(400).json({ success: false, message: 'Post text or photo is required' });
  }

  if (normalizedContent.length > 500) {
    return res.status(400).json({ success: false, message: 'Post content is too long (max 500 chars)' });
  }

  const result = Post.updateById(postId, {
    content: normalizedContent,
    photo: nextPhoto
  });

  if (!result.ok) {
    return res.status(400).json({ success: false, message: result.message || 'Could not edit post' });
  }

  return res.status(200).json({
    success: true,
    message: 'Post updated successfully',
    post: toPublicPost(result.post, currentUser.id)
  });
};

exports.toggleLike = (req, res) => {
  const { postId } = req.params;
  const currentUser = User.findByIdWithPassword(req.user.userId);

  if (!currentUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const post = Post.findById(postId);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  if (!canInteractWithPost(currentUser, post)) {
    return res.status(403).json({ success: false, message: 'You cannot like this post' });
  }

  const result = Post.toggleLike(postId, currentUser.id);
  if (!result.ok) {
    return res.status(400).json({ success: false, message: result.message || 'Could not update like' });
  }

  return res.status(200).json({
    success: true,
    message: result.liked ? 'Post liked' : 'Like removed',
    post: toPublicPost(result.post, currentUser.id)
  });
};

exports.addComment = (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  const currentUser = User.findByIdWithPassword(req.user.userId);

  if (!currentUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Comment text is required' });
  }

  if (text.trim().length > 300) {
    return res.status(400).json({ success: false, message: 'Comment is too long (max 300 chars)' });
  }

  const post = Post.findById(postId);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  if (!canInteractWithPost(currentUser, post)) {
    return res.status(403).json({ success: false, message: 'You cannot comment on this post' });
  }

  const result = Post.addComment(postId, currentUser.id, text.trim());
  if (!result.ok) {
    return res.status(400).json({ success: false, message: result.message || 'Could not add comment' });
  }

  return res.status(201).json({
    success: true,
    message: 'Comment added',
    post: toPublicPost(result.post, currentUser.id)
  });
};
