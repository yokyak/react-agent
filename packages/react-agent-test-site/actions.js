const fetch = require('request');

module.exports = {
  postMessage: {
    action: 'INSERT INTO posts (chatmessage, user_id) VALUES (:message, :id)'
  },
  getMessages: {
    action: 'SELECT posts.chatmessage, posts.date, users.username FROM posts INNER JOIN users ON (posts.user_id = users._id)',
    callback: response => {
      response[0].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
      return { messages: response[0] };
    }
  },
  getUsers: {
    action: 'SELECT username FROM users',
    callback: response => response[0]
  },
  getIds: {
    pre: request => {
      if (request.cookie === '987') return request;
      else return false;
    },
    action: 'SELECT _id FROM users',
    callback: response => response[0]
  },
  register: {
    action: 'INSERT INTO users (username, password) VALUES (:username, :password); SELECT username, _id FROM users WHERE username = :username AND password = :password',
    callback: response => ({ username: response[0][0].username, id: response[0][0]._id }),
    errorMessage: 'yikes'
  },
  login: {
    pre: [
      request => {
        if (request.cookie1 === '123') return request;
        else return false;
      },
      request => {
        if (request.cookie2 === '456') return request;
        else return false;
      },
      // request => false,
    ],
    action: 'SELECT username, _id FROM users WHERE username = :username AND password = :password',
    callback: response => ({ username: response[0][0].username, id: response[0][0]._id }),
    errorMessage: 'oh no'
  },
  getPlanet: {
    action: (resolve, reject, request) => {
      fetch(request.url, (error, response, body) => {
        if (error) reject(error);
        else resolve(body);
      });
    }
  }
};
