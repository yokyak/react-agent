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

const runs = {
  register: {username: 'theBestName', password: 'ugh'},
  getMessages: null,
}

async function getRuns() {
  const returnedRuns = await agent(server, actions, database, true, runs);
  console.log('RETURNED', returnedRuns);
}

getRuns();
