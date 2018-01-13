require('babel-polyfill');

module.exports = (server, database, store, queries) => {
  const socketio = require('socket.io');
  const io = socketio(server);
  const Sequelize = require('sequelize');
  const chalk = require('chalk');
  const Op = Sequelize.Op;

  const sequelize = new Sequelize(database.name, database.user, database.password, {
    dialect: database.dialect,
    host: database.host,
    port: database.port,
    operatorsAliases: Op
  });

  const subscribedSockets = {};

  const handleSet = (key, value, serverValue, assertObject, counter, socket) => {
    if (!store[key].assert || store[key].assert.every(f => f(assertObject))) {

    } else {

    }
    sequelize.query(store[key].query,
      { replacements: value }
    ).then(response => {
      if (store[key].response) {
        sequelize.query(store[key].response,
          { replacements: [response] }
        ).then(secondResponse => {
          subscribedSockets[key].forEach(subscribedSocket => {
            if (store[key].callback) {
              subscribedSocket.emit('response', { response: store[key].callback(secondResponse), key, counter });
            } else {
              subscribedSocket.emit('response', { response: secondResponse, key, counter });
            }
          });
        })
      }
    }).catch(error => {
      console.log(chalk.red('Error with database: '), chalk.yellow(error));
      if (store[key].errorMessage) {
        socket.emit('queryResponse', { error: store[key].errorMessage, counter });
      } else {
        socket.emit('queryResponse', { error: 'Error with database', counter });
      }
    });
  };

  const handleQuery = (key, value, socket, counter, assertObject) => {
    if (!queries[key].assert || queries[key].assert.every(f => f(assertObject))) {
      if (queries[key].query) {
        sequelize.query(queries[key].query,
          { replacements: value }
        ).then(response => {
          if (queries[key].callback) {
            socket.emit('queryResponse', { response: queries[key].callback(response), key, counter });
          } else {
            socket.emit('queryResponse', { response: response, key, counter });
          }
        }).catch(error => {
          console.log(chalk.red('Error with database: '), chalk.yellow(error));
          if (queries[key].errorMessage) {
            socket.emit('queryResponse', { response: { databaseError: queries[key].errorMessage }, counter });
          } else {
            socket.emit('queryResponse', { response: { databaseError: 'Error with database' }, counter });
          }
        });
      } else {
        const request = new Promise((resolve, reject) => {
          queries[key].callback(resolve, reject, value);
        });
        request.then(response => {
          socket.emit('queryResponse', { response, key, counter });
        });
      }
    } else {
      socket.emit('queryResponse', { response: { validationError: 'react-agent: Not all server validations were passed.' }, counter });
    }
  };

  io.on('connection', socket => {
    socket.emit('local');

    socket.on('set', data => {
      const { key, value, serverValue, assertObject, counter } = data;
      if (queries[key] && serverValue) {
        if (subscribedSockets[key]) {
          if (!subscribedSockets[key].includes(socket)) {
            subscribedSockets[key].push(socket);
          }
        } else subscribedSockets[key] = [socket];
        handleSet(key, value, serverValue, assertObject, counter, socket);
        // Emiting response if data should not sync with database to remove from client-side offline cache
      } else socket.emit('response', { counter: data.counter });
    });

    socket.on('query', data => {
      handleQuery(data.key, data.value, socket, data.counter, data.assertObject);
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
};
