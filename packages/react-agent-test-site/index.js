const express = require('express');
const app = express();
const path = require('path');
const agent = require('./../react-agent-server');
const { store, queries } = require('./queries');

app.use(express.static(path.resolve(__dirname, 'build')));

const server = app.listen(process.env.PORT || 3000, () => console.log('Server Connected'));

const database = {
  name: 'qxqigbwr',
  user: 'qxqigbwr',
  password: 'IU0b6NPNVmAwn6gVB6IK5W7mcXZ79IxX',
  dialect: 'postgres',
  host: 'baasu.db.elephantsql.com',
  port: 5432
};

agent(server, database, store, queries);
