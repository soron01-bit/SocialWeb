const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, '../data/users.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, '../data'))) {
  fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
}

// Load users from file
function loadUsers() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter((user) => user && typeof user === 'object' && typeof user.id === 'string');
    }
  } catch (error) {
    console.error('Error loading users:', error);

    try {
      const backupPath = path.join(__dirname, `../data/users.corrupt.${Date.now()}.json`);
      if (fs.existsSync(DB_FILE)) {
        fs.copyFileSync(DB_FILE, backupPath);
      }
    } catch (backupError) {
      console.error('Error backing up corrupt users file:', backupError);
    }
  }
  return [];
}

// Save users to file
function saveUsers(users) {
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), 'utf8');
  fs.renameSync(tempFile, DB_FILE);
}

function normalizeUser(user) {
  return {
    ...user,
    name: user.name || user.username || 'User',
    photo: user.photo || null,
    friends: Array.isArray(user.friends) ? user.friends : [],
    friendRequestsReceived: Array.isArray(user.friendRequestsReceived)
      ? user.friendRequestsReceived
      : [],
    friendRequestsSent: Array.isArray(user.friendRequestsSent)
      ? user.friendRequestsSent
      : []
  };
}

function sanitizeUser(user) {
  const { password, ...userWithoutPassword } = normalizeUser(user);
  return userWithoutPassword;
}

class User {
  static create(userData) {
    const { username, email, password, name, photo } = userData;
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const createdAt = new Date().toISOString();

    const users = loadUsers();
    const newUser = {
      id,
      username,
      email,
      name,
      photo,
      friends: [],
      friendRequestsReceived: [],
      friendRequestsSent: [],
      password: hashedPassword,
      createdAt
    };

    users.push(newUser);
    saveUsers(users);

    return this.findById(id);
  }

  static updateById(id, updates) {
    const users = loadUsers();
    const userIndex = users.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      return null;
    }

    const currentUser = normalizeUser(users[userIndex]);
    const nextUser = {
      ...currentUser,
      ...updates,
      id: currentUser.id,
      password: currentUser.password,
      createdAt: currentUser.createdAt
    };

    users[userIndex] = nextUser;
    saveUsers(users);

    return sanitizeUser(nextUser);
  }

  static getAll() {
    return loadUsers()
      .filter((user) => user && user.id)
      .map((user) => sanitizeUser(user));
  }

  static sendFriendRequest(fromUserId, toUserId) {
    const users = loadUsers();
    const fromIndex = users.findIndex((user) => user.id === fromUserId);
    const toIndex = users.findIndex((user) => user.id === toUserId);

    if (fromIndex === -1 || toIndex === -1) {
      return { ok: false, message: 'User not found' };
    }

    if (fromUserId === toUserId) {
      return { ok: false, message: 'Cannot send request to yourself' };
    }

    const fromUser = normalizeUser(users[fromIndex]);
    const toUser = normalizeUser(users[toIndex]);

    if (fromUser.friends.includes(toUserId)) {
      return { ok: false, message: 'Already friends' };
    }

    if (fromUser.friendRequestsSent.includes(toUserId)) {
      return { ok: false, message: 'Friend request already sent' };
    }

    fromUser.friendRequestsSent.push(toUserId);
    toUser.friendRequestsReceived.push(fromUserId);

    users[fromIndex] = fromUser;
    users[toIndex] = toUser;
    saveUsers(users);

    return { ok: true };
  }

  static acceptFriendRequest(userId, fromUserId) {
    const users = loadUsers();
    const userIndex = users.findIndex((user) => user.id === userId);
    const fromIndex = users.findIndex((user) => user.id === fromUserId);

    if (userIndex === -1 || fromIndex === -1) {
      return { ok: false, message: 'User not found' };
    }

    const user = normalizeUser(users[userIndex]);
    const fromUser = normalizeUser(users[fromIndex]);

    if (!user.friendRequestsReceived.includes(fromUserId)) {
      return { ok: false, message: 'Friend request not found' };
    }

    user.friendRequestsReceived = user.friendRequestsReceived.filter((id) => id !== fromUserId);
    fromUser.friendRequestsSent = fromUser.friendRequestsSent.filter((id) => id !== userId);

    if (!user.friends.includes(fromUserId)) {
      user.friends.push(fromUserId);
    }

    if (!fromUser.friends.includes(userId)) {
      fromUser.friends.push(userId);
    }

    users[userIndex] = user;
    users[fromIndex] = fromUser;
    saveUsers(users);

    return { ok: true };
  }

  static deleteById(userId) {
    const users = loadUsers();
    const user = users.find((item) => item.id === userId);

    if (!user) {
      return { ok: false, message: 'User not found' };
    }

    const remainingUsers = users
      .filter((item) => item.id !== userId)
      .map((item) => {
        const nextUser = normalizeUser(item);
        nextUser.friends = nextUser.friends.filter((id) => id !== userId);
        nextUser.friendRequestsReceived = nextUser.friendRequestsReceived.filter((id) => id !== userId);
        nextUser.friendRequestsSent = nextUser.friendRequestsSent.filter((id) => id !== userId);
        return nextUser;
      });

    saveUsers(remainingUsers);
    return { ok: true };
  }

  static findByEmail(email) {
    const users = loadUsers();
    return users.find(u => u.email === email);
  }

  static findById(id) {
    const users = loadUsers();
    const user = users.find(u => u.id === id);
    if (user) {
      return sanitizeUser(user);
    }
    return null;
  }

  static findByIdWithPassword(id) {
    const users = loadUsers();
    const user = users.find(u => u.id === id);
    return user ? normalizeUser(user) : undefined;
  }

  static findByEmailWithPassword(email) {
    const users = loadUsers();
    const user = users.find(u => u.email === email);
    return user ? normalizeUser(user) : undefined;
  }

  static emailExists(email) {
    const users = loadUsers();
    return users.some(u => u.email === email);
  }

  static emailExistsForOtherUser(email, userId) {
    const users = loadUsers();
    return users.some((user) => user.email === email && user.id !== userId);
  }

  static usernameExists(username) {
    const users = loadUsers();
    return users.some(u => u.username === username);
  }

  static usernameExistsForOtherUser(username, userId) {
    const users = loadUsers();
    return users.some((user) => user.username === username && user.id !== userId);
  }

  static removeAuthData(userId) {
    return this.deleteById(userId);
  }

  static matchPassword(enteredPassword, hashedPassword) {
    return bcrypt.compareSync(enteredPassword, hashedPassword);
  }
}

module.exports = User;
