const path = require('path');
const agent = require('./../react-agent-server');
const actions = require('./actions');
const express = require('express');
const app = express();

app.use(express.static(path.resolve(__dirname, 'build')));

const server = app.listen(3000);

const database = {
  name: 'qxqigbwr',
  user: 'qxqigbwr',
  password: 'IU0b6NPNVmAwn6gVB6IK5W7mcXZ79IxX',
  dialect: 'postgres',
  host: 'baasu.db.elephantsql.com',
  port: 5432
};

agent(server, actions, database);
