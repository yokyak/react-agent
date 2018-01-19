require('babel-polyfill');

module.exports = (server, actions, database, logger = false, stop = false) => {
  const socketio = require('socket.io');
  const io = socketio(server);
  const chalk = require('chalk');
  let sequelize;
  let offlineCache = {};
  let socket;

  if (database) {
    const Sequelize = require('sequelize');
    const { Op } = Sequelize;
    sequelize = new Sequelize(database.name, database.user, database.password, {
      dialect: database.dialect,
      host: database.host,
      port: database.port,
      operatorsAliases: Op,
      logging: logger === true ? action => console.log(' ', action) : false,
    });
  }

  const subscribedSockets = {};

  // Precaution for offline cache:
  // If an action with the same UUID has already been run
  // in the last three seconds, then the action will not be run again.
  // For example: 1) the client deletes the most recent comment and the actions runs on the server.
  // 2) the client does not receive the response because the network disconnects.
  // 3) once the network reconnects, React Agent tries to run the action again (delete the most recent user), which would be a mistake.
  // While steps #1-3 could be a feature, not a bug, this is a compromise approach
  // since the cache is deleted from memory every three seconds.
  setInterval(() => {
    offlineCache = {};
  }, 3000);

  const runAction = (key, request, actionId, socketID, callback) => {
    if (!offlineCache[socketID] || !offlineCache[socketID][actionId]) {
      if (offlineCache[socketID]) offlineCache[socketID][actionId] = 0;
      else offlineCache[socketID] = { [actionId]: 0 };
      if (logger && typeof logger !== 'function') {
        if (request) console.log(chalk.bold.green('Key: '), chalk.bold.blue(key), chalk.bold.green('\nID:'), chalk.blue(actionId), '\n', chalk.bold(' From client: '), request);
        else console.log(chalk.bold.green('Key: '), chalk.bold.blue(key), chalk.bold.blue('\nID:'), chalk.blue(actionId));
      }
      if (logger && typeof logger === 'function') {
        if (request) logger('Key: ' + key + 'ID:' + actionId + ' From client: ' + request);
        else logger('Key: ' + key + 'ID:' + actionId);
      }
      if (actions[key].pre) {
        for (let i = 0; i < actions[key].pre.length; i++) {
          const returned = actions[key].pre[i](request);
          if (returned === false) {
            if (logger && typeof logger !== 'function') console.log(chalk.bold.red(`  Pre-error: did not pass function #${i + 1}`));
            if (logger && typeof logger === 'function') logger(`  Pre-error: did not pass function #${i + 1}`);
            return callback({ key, preError: 'React Agent: Not all server pre functions passed.', actionId });
          }
          request = returned;
        }
      }

      if (logger && typeof logger !== 'function' && actions[key].pre) console.log(chalk.bold('  Pre: '), 'Passed all function(s)');
      if (logger && typeof logger === 'function' && actions[key].pre) logger('  Pre: ' + 'Passed all function(s)');

      if (typeof actions[key].action !== 'function') {
        sequelize.query(actions[key].action, { bind: request })
          .then((response) => {
            if (actions[key].callback) {
              callback({ key, response: actions[key].callback(response), actionId });
            } else {
              callback({ key, response, actionId });
            }
          })
          .catch((error) => {
            console.log(chalk.bold.red('  Error with database: '), chalk.yellow(error));
            if (actions[key].errorMessage) {
              callback({ key, databaseError: actions[key].errorMessage, actionId });
            } else {
              callback({ key, databaseError: 'Error with database', actionId });
            }
          });
      } else {
        const promise = new Promise((resolve, reject) => {
          actions[key].action(resolve, reject, request);
        });
        promise.then((response) => {
          console.log(chalk.bold('  Action function: '), 'success');
          callback({ key, response, actionId });
        });
      }
    }
  };

  io.on('connection', (socket) => {
    socket = socket;

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
        runAction(data.key, data.request, data.actionId, data.socketID, (result) => {
          subscribedSockets[data.key].forEach((subSocket) => {
            subSocket.emit('subscriber', result, data.actionId);
          });
        });
      }
    });

    socket.on('run', (data) => {
      let response = {};
      data.keys.forEach((key, i) => {
        runAction(key, data.request, data.actionId, data.socketID, (result) => {
          if (!result.preError && !result.databaseError) console.log(chalk.bold('  Callback: '), 'success');
          response[result.key] = result;
          console.log(chalk.bold('  Completed: '), key, data.actionId);
          if (i === data.keys.length - 1) {
            if (data.keys.length === 1) response = response[data.keys[0]];
            socket.emit('response', response);
          }
          if (stop) {
            throw new Error('Ending for testing');
          }
        });
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
