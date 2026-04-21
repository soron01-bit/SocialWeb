const fs = require('fs');
const path = require('path');

const POSTS_FILE = path.join(__dirname, '../data/posts.json');

if (!fs.existsSync(path.join(__dirname, '../data'))) {
  fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
}

if (!fs.existsSync(POSTS_FILE)) {
  fs.writeFileSync(POSTS_FILE, '[]', 'utf8');
}

function loadPosts() {
  try {
    return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
  } catch (error) {
    return [];
  }
}

function savePosts(posts) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
}

function normalizePost(post) {
  return {
    ...post,
    content: post.content || '',
    photo: post.photo || null,
    likes: Array.isArray(post.likes) ? post.likes : [],
    comments: Array.isArray(post.comments) ? post.comments : []
  };
}

class Post {
  static create(authorId, content, photo = null) {
    const posts = loadPosts();
    const post = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      authorId,
      content,
      photo,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: []
    };

    posts.push(post);
    savePosts(posts);
    return normalizePost(post);
  }

  static getFeedForUser(userId, friendIds = []) {
    const allowedAuthorIds = new Set([userId, ...friendIds]);
    return loadPosts()
      .filter((post) => allowedAuthorIds.has(post.authorId))
      .map((post) => normalizePost(post))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static getAllFeed() {
    return loadPosts()
      .map((post) => normalizePost(post))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static findById(postId) {
    const post = loadPosts().find((item) => item.id === postId);
    return post ? normalizePost(post) : null;
  }

  static updateById(postId, updates) {
    const posts = loadPosts();
    const postIndex = posts.findIndex((post) => post.id === postId);

    if (postIndex === -1) {
      return { ok: false, message: 'Post not found' };
    }

    const currentPost = normalizePost(posts[postIndex]);
    const nextPost = {
      ...currentPost,
      ...updates,
      id: currentPost.id,
      authorId: currentPost.authorId,
      createdAt: currentPost.createdAt,
      likes: currentPost.likes,
      comments: currentPost.comments
    };

    posts[postIndex] = nextPost;
    savePosts(posts);

    return { ok: true, post: normalizePost(nextPost) };
  }

  static deleteById(postId) {
    const posts = loadPosts();
    const existingIndex = posts.findIndex((post) => post.id === postId);

    if (existingIndex === -1) {
      return { ok: false, message: 'Post not found' };
    }

    posts.splice(existingIndex, 1);
    savePosts(posts);
    return { ok: true };
  }

  static toggleLike(postId, userId) {
    const posts = loadPosts();
    const postIndex = posts.findIndex((post) => post.id === postId);

    if (postIndex === -1) {
      return { ok: false, message: 'Post not found' };
    }

    const post = normalizePost(posts[postIndex]);
    const likedIndex = post.likes.indexOf(userId);
    let liked = false;

    if (likedIndex >= 0) {
      post.likes.splice(likedIndex, 1);
    } else {
      post.likes.push(userId);
      liked = true;
    }

    posts[postIndex] = post;
    savePosts(posts);

    return { ok: true, liked, post };
  }

  static addComment(postId, userId, text) {
    const posts = loadPosts();
    const postIndex = posts.findIndex((post) => post.id === postId);

    if (postIndex === -1) {
      return { ok: false, message: 'Post not found' };
    }

    const post = normalizePost(posts[postIndex]);
    const comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      text,
      createdAt: new Date().toISOString()
    };

    post.comments.push(comment);
    posts[postIndex] = post;
    savePosts(posts);

    return { ok: true, comment, post };
  }

  static deleteByAuthor(authorId) {
    const posts = loadPosts();
    const filteredPosts = posts.filter((post) => post.authorId !== authorId);
    savePosts(filteredPosts);
    return { ok: true };
  }
}

module.exports = Post;
