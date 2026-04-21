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
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  return [];
}

// Save users to file
function saveUsers(users) {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2), 'utf8');
}

class User {
  static create(userData) {
    const { username, email, password } = userData;
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const createdAt = new Date().toISOString();

    const users = loadUsers();
    const newUser = {
      id,
      username,
      email,
      password: hashedPassword,
      createdAt
    };

    users.push(newUser);
    saveUsers(users);

    return this.findById(id);
  }

  static findByEmail(email) {
    const users = loadUsers();
    return users.find(u => u.email === email);
  }

  static findById(id) {
    const users = loadUsers();
    const user = users.find(u => u.id === id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  static findByIdWithPassword(id) {
    const users = loadUsers();
    return users.find(u => u.id === id);
  }

  static findByEmailWithPassword(email) {
    const users = loadUsers();
    return users.find(u => u.email === email);
  }

  static emailExists(email) {
    const users = loadUsers();
    return users.some(u => u.email === email);
  }

  static usernameExists(username) {
    const users = loadUsers();
    return users.some(u => u.username === username);
  }

  static matchPassword(enteredPassword, hashedPassword) {
    return bcrypt.compareSync(enteredPassword, hashedPassword);
  }
}

module.exports = User;
