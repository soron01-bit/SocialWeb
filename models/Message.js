const fs = require('fs');
const path = require('path');

const MESSAGES_FILE = path.join(__dirname, '../data/messages.json');

if (!fs.existsSync(path.join(__dirname, '../data'))) {
  fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
}

if (!fs.existsSync(MESSAGES_FILE)) {
  fs.writeFileSync(MESSAGES_FILE, '[]', 'utf8');
}

function loadMessages() {
  try {
    const raw = fs.readFileSync(MESSAGES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveMessages(messages) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
}

function conversationKey(userAId, userBId) {
  return [userAId, userBId].sort().join('__');
}

function normalizeMessage(message) {
  return {
    ...message,
    text: message.text || '',
    photo: message.photo || null
  };
}

class Message {
  static send(fromUserId, toUserId, text, photo = null) {
    const messages = loadMessages();
    const nextMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromUserId,
      toUserId,
      text,
      photo,
      createdAt: new Date().toISOString(),
      conversationKey: conversationKey(fromUserId, toUserId)
    };

    messages.push(nextMessage);
    saveMessages(messages);
    return normalizeMessage(nextMessage);
  }

  static getConversation(userAId, userBId) {
    const key = conversationKey(userAId, userBId);
    return loadMessages()
      .filter((message) => message.conversationKey === key)
      .map((message) => normalizeMessage(message))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  static deleteByUser(userId) {
    const filteredMessages = loadMessages().filter(
      (message) => message.fromUserId !== userId && message.toUserId !== userId
    );
    saveMessages(filteredMessages);
    return { ok: true };
  }
}

module.exports = Message;