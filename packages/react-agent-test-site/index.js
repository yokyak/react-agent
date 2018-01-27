require('dotenv').config();
const path = require('path');
const agent = require('./../react-agent-server');
const actions = require('./actions');
const express = require('express');
const app = express();


app.use(express.static(path.resolve(__dirname, 'build')));

const server = app.listen(3000);

const database = {
  name: process.env.DBNAME,
  user: process.env.DBUSER,
  password: process.env.DBPASS,
  dialect: 'postgres',
  host: process.env.DBURL,
  port: process.env.DBPORT
};

// const runs = {
//   register: { username: 'theBestName', password: 'ugh' },
//   postMessage: { message: 'hi NOW', id: 3 },
//   getMessages: null,
// }

// add runs as fifth parameter to use PostMan style testing for server-side
agent(server, actions, database, false /*, runs */);
