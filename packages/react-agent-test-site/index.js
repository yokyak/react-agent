const express = require('express');
const app = express();
const path = require('path');
const agent = require('./../react-agent-server');

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
    callback: response => (response[0]),
  },
  getMessages: {
    query: 'SELECT posts.chatmessage, posts.date, users.username FROM posts INNER JOIN users ON (posts.user_id = users._id)',
    callback: response => ({ data: response[0] }),
  },
  register: {
    query: 'INSERT INTO users (username, password) VALUES (?, ?); SELECT username, _id FROM users WHERE username = ? AND password = ?',
    callback: response => ({ username: response[0][0].username, id: response[0][0]._id }),
    errorMessage: 'yikes',
  },
  login: {
    query: 'SELECT username, _id FROM users WHERE username = ? AND password = ?',
    // in documentation recommend to console.log response to see db results
    callback: response => ({ username: response[0][0].username, id: response[0][0]._id }),
    errorMessage: 'oh no',
  },
};

agent(server, db, queries);
