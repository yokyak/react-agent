require('babel-polyfill');
/*eslint-disable*/
module.exports = (server, db, queries, sets) => {
  const socketio = require('socket.io');
  const io = socketio(server);
  const Sequelize = require('sequelize');
  const chalk = require('chalk');
  const Op = Sequelize.Op;

  const sequelize = new Sequelize(db.name, db.user, db.password, {
    dialect: db.dialect,
    host: db.host,
    port: db.port,
    operatorsAliases: Op
  });

  const subscribedSockets = {};

  const handleSet = (key, value, socket, counter, request) => {
    if ( key in sets ) {
      if (!sets[key].pre || sets[key].pre.every(f => f(request))) {
        sequelize.query(sets[key].onSet,
          { replacements: value }
        ).then(response => {
          if( sets[key].emit ) {
            handleQuery(sets[key].emit, socket, counter, request);
          }
        })
      }
    }

    else {
      if (!sets[key].pre || sets[key].pre.every(f => f(request))) {
        sequelize.query(queries[key].query,
          { replacements: value }
        ).then(response => {
          if (queries[key].response) {
            sequelize.query(queries[key].response,
              { replacements: [response] }
            ).then(secondResponse => {
              subscribedSockets[key].forEach(subscribedSocket => {
                if (queries[key].callback) {
                  subscribedSocket.emit('response', { response: queries[key].callback(secondResponse), key, counter });
                } else {
                  subscribedSocket.emit('response', { response: secondResponse, key, counter });
                }
              });
            })
          }
        }).catch(error => {
          console.log(chalk.red('Error with database: '), chalk.yellow(error));
          if (queries[key].errorMessage) {
            socket.emit('queryResponse', { error: queries[key].errorMessage, counter });
          } else {
            socket.emit('queryResponse', { error: 'Error with database', counter });
          }
        });
      }
    }
  };

  const handleQuery = (key, value, socket, counter, request) => {
    console.log('QUERIEsS', queriesSSS);
    if (!queries[key].pre || queries[key].pre.every(f => f(request))) {
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
      if (queries[data.key] || sets[data.key]) {
        if (subscribedSockets[data.key]) {
          if (!subscribedSockets[data.key].includes(socket)) {
            subscribedSockets[data.key].push(socket);
          }
        } else {
          subscribedSockets[data.key] = [socket];
        }
        if (data.runQueries) {
          handleSet(data.key, data.value, socket, data.counter, data.request);
        }
      } else {
        // Emiting response if data should not sync with database to remove from client-side offline cache
        socket.emit('response', { counter: data.counter });
      }
    });

    socket.on('query', data => {
      handleQuery(data.key, data.value, socket, data.counter, data.request);
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
