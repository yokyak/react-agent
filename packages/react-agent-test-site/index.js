const path = require('path');
const agent = require('./../react-agent-server');
const actions = require('./actions');
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  let contentType = 'text/html', filePath = req.url;
  if (filePath === '/') filePath = '/index.html';
  else contentType = 'text/javascript';
  fs.readFile('./build' + filePath, (err, data) => {
    res.writeHead(200, { 'Content-Type': contentType });
    res.write(data);
    res.end();
  });
}).listen(3000);

const database = {
  name: 'qxqigbwr',
  user: 'qxqigbwr',
  password: 'IU0b6NPNVmAwn6gVB6IK5W7mcXZ79IxX',
  dialect: 'postgres',
  host: 'baasu.db.elephantsql.com',
  port: 5432
};

agent(server, actions, database, true);
