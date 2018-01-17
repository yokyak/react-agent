require('babel-polyfill');

module.exports = (server, queries, database, logger = false) => {
  const socketio = require('socket.io');
  const io = socketio(server);
  const chalk = require('chalk');
  let sequelize;

  if (database) {
    const Sequelize = require('sequelize');
    const { Op } = Sequelize;
    sequelize = new Sequelize(database.name, database.user, database.password, {
      dialect: database.dialect,
      host: database.host,
      port: database.port,
      operatorsAliases: Op,
      logging: logger === true ? action => console.log(' ', action) : false
    });
  }

  const subscribedSockets = {};

  const runQuery = (key, request, queryId, callback) => {
    if (logger) {
      if (request) console.log(chalk.bold.green('Key: '), chalk.bold.blue(key), chalk.bold.green('\nID:'), chalk.blue(queryId), '\n', chalk.bold(' From client: '), request);
      else console.log(chalk.bold.green('Key: '), chalk.bold.blue(queries[key]), chalk.bold.blue('\nID:'), chalk.blue(queryId));
    }
    if (queries[key].pre) {
      for (let i = 0; i < queries[key].pre.length; i++) {
        const returned = queries[key].pre[i](request);
        if (returned === false) {
          if (logger) console.log(chalk.bold.red(`  Pre-error: did not pass function #${i + 1}`));
          return callback({ preError: 'React Agent: Not all server pre functions passed.', queryId });
        }
        request = returned;
      }
    }

    if (logger && queries[key].pre) console.log(chalk.bold('  Pre: '), 'Passed all function(s)');

    if (typeof queries[key].query !== 'function') {
      sequelize.query(queries[key].query, { bind: request })
        .then((response) => {
          if (queries[key].callback) {
            callback({ key, response: queries[key].callback(response), queryId });
          } else {
            callback({ key, response, queryId });
          }
        })
        .catch((error) => {
          console.log(chalk.bold.red('  Error with database: '), chalk.yellow(error));
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
      promise.then((response) => {
        console.log(chalk.bold('  Query function: '), 'success');
        callback({ key, response, queryId })
      });
    }
  };

  io.on('connection', (socket) => {
    socket.on('subscribe', ({ key }) => {
      if (subscribedSockets[key]) {
        if (!subscribedSockets[key].includes(socket)) {
          subscribedSockets[key].push(socket);
        }
      } else subscribedSockets[key] = [socket];
    });

    socket.on('unsubscribe', ({ key }) => {
      if (subscribedSockets[key] && subscribedSockets[key].includes(socket)) {
        const i = subscribedSockets[key].indexOf(socket);
        if (i > -1) {
          const arr = subscribedSockets[key].slice();
          arr.splice(i, 1);
          subscribedSockets[key] = arr;
        }
      }
    });

    socket.on('emit', (data) => {
      if (subscribedSockets[data.key]) {
        runQuery(data.key, data.request, data.queryId, (result) => {
          subscribedSockets[data.key].forEach((subSocket) => {
            subSocket.emit('subscriber', result);
          });
        });
      }
    });

    socket.on('query', (data) => {
      runQuery(data.key, data.request, data.queryId, (result) => {
        console.log(chalk.bold('  Callback: '), 'success');
        socket.emit('response', result);
        console.log(chalk.bold('  Completed: '), data.key, data.queryId);
      });
    });

    // Search through each key in subscribedSockets object and look for matching socket
    // Remove matching socket from each of the arrays corresponding to the key
    socket.on('disconnect', () => {
      Object.keys(subscribedSockets).forEach((key) => {
        const i = subscribedSockets[key].indexOf(socket);
        if (i > -1) {
          const arr = subscribedSockets[key].slice();
          arr.splice(i, 1);
          subscribedSockets[key] = arr;
        }
      });
    });
  });
};
