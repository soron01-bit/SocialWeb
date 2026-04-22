const ONLINE_WINDOW_MS = 45 * 1000;

const presenceByUserId = new Map();

function markUserActive(userId) {
  if (!userId) {
    return;
  }

  presenceByUserId.set(userId, Date.now());
}

function getPresenceForUser(userId) {
  if (!userId) {
    return {
      online: false,
      lastSeenAt: null
    };
  }

  const lastSeenEpoch = presenceByUserId.get(userId) || 0;
  const online = lastSeenEpoch > 0 && Date.now() - lastSeenEpoch <= ONLINE_WINDOW_MS;

  return {
    online,
    lastSeenAt: lastSeenEpoch ? new Date(lastSeenEpoch).toISOString() : null
  };
}

function getPresenceForUsers(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  return userIds.map((userId) => ({
    userId,
    ...getPresenceForUser(userId)
  }));
}

module.exports = {
  markUserActive,
  getPresenceForUser,
  getPresenceForUsers,
  ONLINE_WINDOW_MS
};
