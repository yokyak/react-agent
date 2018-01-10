module.exports = function agent(server, db, queries) {
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

  const handleSet = (key, value, socket, counter) => {
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
  };

  const handleQuery = (key, value, socket, counter) => {
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
        socket.emit('queryResponse', { error: queries[key].errorMessage, counter });
      } else {
        socket.emit('queryResponse', { error: 'Error with database', counter });
      }
    });
  };

  io.on('connection', socket => {
    socket.emit('local');

    socket.on('set', data => {
      if (queries[data.key]) {
        if (subscribedSockets[data.key]) {
          if (!subscribedSockets[data.key].includes(socket)) {
            subscribedSockets[data.key].push(socket);
          }
        } else {
          subscribedSockets[data.key] = [socket];
        }
        if (data.runQueries) {
          handleSet(data.key, data.value, socket, data.counter);
        }
      } else {
        // Emiting response if data should not sync with database to remove from client-side offline cache
        socket.emit('response', { counter: data.counter });
      }
    });

    socket.on('query', data => {
      handleQuery(data.key, data.value, socket, data.counter);
    });
  });
};
