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
    photo: message.photo || null,
    reactions: Array.isArray(message.reactions) ? message.reactions : [],
    deletedBy: Array.isArray(message.deletedBy) ? message.deletedBy : []
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
      conversationKey: conversationKey(fromUserId, toUserId),
      reactions: [],
      deletedBy: []
    };

    messages.push(nextMessage);
    saveMessages(messages);
    return normalizeMessage(nextMessage);
  }

  static findById(messageId) {
    return loadMessages()
      .map((message) => normalizeMessage(message))
      .find((message) => message.id === messageId) || null;
  }

  static updateById(messageId, updater) {
    const messages = loadMessages();
    let updatedMessage = null;

    const nextMessages = messages.map((message) => {
      if (message.id !== messageId) {
        return message;
      }

      const normalized = normalizeMessage(message);
      const result = updater({ ...normalized });

      if (!result) {
        updatedMessage = normalized;
        return normalized;
      }

      updatedMessage = normalizeMessage(result);
      return updatedMessage;
    });

    if (!updatedMessage) {
      return null;
    }

    saveMessages(nextMessages.map((message) => normalizeMessage(message)));
    return updatedMessage;
  }

  static setReaction(messageId, userId, reaction) {
    return this.updateById(messageId, (message) => {
      const filteredReactions = message.reactions.filter((item) => item.userId !== userId);

      if (reaction) {
        filteredReactions.push({
          userId,
          reaction,
          updatedAt: new Date().toISOString()
        });
      }

      return {
        ...message,
        reactions: filteredReactions
      };
    });
  }

  static deleteForUser(messageId, userId) {
    const messages = loadMessages();
    const existingMessage = messages.find((message) => message.id === messageId);

    if (!existingMessage) {
      return null;
    }

    const normalized = normalizeMessage(existingMessage);

    if (normalized.fromUserId === userId) {
      const remainingMessages = messages.filter((message) => message.id !== messageId);
      saveMessages(remainingMessages);
      return { deletedForEveryone: true };
    }

    const updated = this.updateById(messageId, (message) => {
      const deletedBy = message.deletedBy.includes(userId)
        ? message.deletedBy
        : [...message.deletedBy, userId];

      return {
        ...message,
        deletedBy
      };
    });

    return updated ? { deletedForEveryone: false } : null;
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