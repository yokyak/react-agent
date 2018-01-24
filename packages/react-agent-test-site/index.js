const path = require('path');
const agent = require('./../react-agent-server');
const actions = require('./actions');
const express = require('express');
const app = express();
require('dotenv').config()

app.use(express.static(path.resolve(__dirname, 'build')));

const server = app.listen(3000);

const database = {
  name: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  dialect: 'postgres',
  host: process.env.DB_URL,
  port: process.env.DB_PORT
};

agent(server, actions, database, true);
