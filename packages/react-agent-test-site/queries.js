const request = require('request');

const store = {
  messages: {
    onSet: 'INSERT INTO posts (chatmessage, user_id) VALUES (|message|, |userid|)',
    emit: 'getMessages'
  }
};

const queries = {
  getMessages: {
    query: 'SELECT posts.chatmessage, posts.date, users.username FROM posts INNER JOIN users ON (posts.user_id = users._id)',
    callback: response => {
      response[0].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
      return { data: response[0] };
    }
  },
  register: {
    query: 'INSERT INTO users (username, password) VALUES (|username|, |password|); SELECT username, _id FROM users WHERE username = |username| AND password = |password|',
    callback: response => ({ username: response[0][0].username, id: response[0][0]._id }),
    errorMessage: 'yikes'
  },
  login: {
    pre: [request => request.val1, request => request.val2],
    query: 'SELECT username, _id FROM users WHERE username = |username| AND password = |password|',
    callback: response => ({ username: response[0][0].username, id: response[0][0]._id }),
    errorMessage: 'oh no'
  },
  getPlanet: {
    callback: (resolve, reject, values) => {
      const url = values[0];
      request(url, (error, response, body) => {
        if (error) reject(error);
        else resolve(body);
      });
    }
  }
};

module.exports = { store, queries };