require('babel-polyfill');

module.exports = (server, queries, database) => {
  const socketio = require('socket.io');
  const io = socketio(server);
  const chalk = require('chalk');

  if (database) {
    const Sequelize = require('sequelize');
    const Op = Sequelize.Op;
    const sequelize = new Sequelize(database.name, database.user, database.password, {
      dialect: database.dialect,
      host: database.host,
      port: database.port,
      operatorsAliases: Op
    });
  }

  const subscribedSockets = {};

  io.on('connection', socket => {

    socket.on('subscribe', ({ key }) => {
      if(subscribedSockets[key]) {
        if (!subscribedSockets[key].includes(socket)) {
          subscribedSockets[key].push(socket);
        }
      } else subscribedSockets[key] = [socket];
    });

    socket.on('emit', data => {
      if (subscribedSockets[data.key]) {
        runQuery(data.key, data.request, data.queryId, result => {
          subscribedSockets[data.key].forEach(subSocket => {
            subSocket.emit('subscriber', result);
          });
        });
      }
    });

    socket.on('query', data => {
      runQuery(data.key, data.request, data.queryId, result => {
        socket.emit('response', result);
      });
    });

    // Search through each key in subscribedSockets object and look for matching socket
    // Remove matching socket from each of the arrays corresponding to the key
    socket.on('disconnect', () => {
      Object.keys(subscribedSockets).forEach(key => {
        const i = subscribedSockets[key].indexOf(socket);
        if (i > -1) {
          const arr = subscribedSockets[key].slice();
          arr.splice(i, 1);
          subscribedSockets[key] = arr;
        }
      });
    });
  });

  const runQuery = (key, request, queryId, callback) => {
    if (queries[key].pre) {
      for (let i = 0; i < queries[key].pre.length; i++) {
        const returned = queries[key].pre[i](request);
        if (returned === false) {
          return callback({ preError: 'React Agent: Not all server pre functions passed.', queryId });
        } else {
          request = returned;
        }
      }
    }

    if (typeof queries[key].query !== 'function') {
      const { string, replacements } = parseSQL(queries[key].query, request);
      sequelize.query(string, { replacements })
        .then(response => {
          if (queries[key].callback) {
            callback({ key, response: queries[key].callback(response), queryId });
          } else {
            callback({ key, response, queryId });
          }
        })
        .catch(error => {
          console.log(chalk.red('Error with database: '), chalk.yellow(error));
          if (queries[key].errorMessage) {
            callback({ databaseError: queries[key].errorMessage, queryId });
          } else {
            callback({ databaseError: 'Error with database', queryId });
          }
        });
    } else {
      const promise = new Promise((resolve, reject) => {
        queries[key].query(resolve, reject, request);
      });
      promise.then(response => callback({ key, response, queryId }));
    }
  };

  const parseSQL = (string, request) => {
    const reg = new RegExp('[a-zA-Z0-9]+', 'g');
    let foundVariable = false, start = 0, currentVariable = '';
    const replacements = [];
    for (let i = 0; i <= string.length; i++) {
      let char = string[i];
      if (foundVariable) {
        if (i === string.length || !char.match(reg)) {
          if (request[currentVariable]) {
            replacements.push(request[currentVariable]);
            string = string.substring(0, start) + '?' + string.substring(i, string.length);
            i = i - (currentVariable.length - 1);
          }
          foundVariable = false;
          currentVariable = '';
        } else {
          currentVariable += char;
        }
      }
      if (char === '$') {
        foundVariable = true;
        start = i;
      }
    }
    return { string, replacements };
  };
};
