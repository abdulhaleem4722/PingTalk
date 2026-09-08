const MESSAGES_PREFIX = 'pingtalk_chat_';
const USERS_KEY = 'pingtalk_sidebar_users';

export const saveMessagesToCache = (userId, messages) => {
  try {
    localStorage.setItem(MESSAGES_PREFIX + userId, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to cache messages', error);
  }
};

export const loadMessagesFromCache = (userId) => {
  try {
    const data = localStorage.getItem(MESSAGES_PREFIX + userId);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

export const saveUsersToCache = (users) => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to cache users', error);
  }
};

export const loadUsersFromCache = () => {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};