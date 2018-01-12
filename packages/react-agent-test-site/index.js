const express = require('express');
const app = express();
const path = require('path');
const agent = require('./../react-agent-server');
const request = require('request');

app.use(express.static(path.resolve(__dirname, 'build')));

const server = app.listen(process.env.PORT || 3000, () => console.log("Server Connected"));

const db = {
  name: 'qxqigbwr',
  user: 'qxqigbwr',
  password: 'IU0b6NPNVmAwn6gVB6IK5W7mcXZ79IxX',
  dialect: 'postgres',
  host: 'baasu.db.elephantsql.com',
  port: 5432
};

const queries = {
  messages: {
    query: 'INSERT INTO posts (chatmessage, user_id) VALUES (?, ?)',
    response: 'SELECT posts.chatmessage, posts.date, users.username FROM posts INNER JOIN users ON (posts.user_id = users._id)',
    callback: response => {
      response[0].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
      return response[0];
    }
  },
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
    query: 'INSERT INTO users (username, password) VALUES (?, ?); SELECT username, _id FROM users WHERE username = ? AND password = ?',
    callback: response => ({ username: response[0][0].username, id: response[0][0]._id }),
    errorMessage: 'yikes'
  },
  login: {
    pre: [request => request.val1, request => request.val2],
    query: 'SELECT username, _id FROM users WHERE username = ? AND password = ?',
    // in documentation recommend to console.log response to see db results
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

agent(server, db, queries);
