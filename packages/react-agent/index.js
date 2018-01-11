import React, { Component, cloneElement } from 'react';
import io from 'socket.io-client';

class Store extends Component {
  constructor(props) {
    super(props);
    this.state = props.store;
  }

  addToStore(key, value) {
    this.setState({ [key]: value });
  }

  render() {
    return cloneElement(this.props.children, this.state);
  }
}

let store;
let socket;
let counter = 0;
let server = false;
const cache = {};

export const Agent = (props) => {
  store = new Store(props);
  server = true;
  if (props.server && props.server === 'false') server = false;
  if (server) {
    socket = io.connect();
    window.addEventListener('online', () => {
      socket = io.connect();
    });

    socket.on('local', () => {
      Object.values(cache).forEach((value) => {
        socket.emit(value.method, value.arguments);
      });
    });

    socket.on('response', (data) => {
      if (data.key) {
        set(data.key, data.response, false);
      }

      delete cache[data.counter];
    });

    socket.on('queryResponse', (data) => {
      if (data.counter in cache) {
        if (cache[data.counter].callback) {
          cache[data.counter].callback(data.response);
        }
      }

      delete cache[data.counter];
    });
  }
  return store;
}

export const get = (key) => {
  return store.state[key];
}

export const set = (key, value, runQueries = true, callback) => {
  if (callback) {
    const oldState = store.state[key];
    store.addToStore(key, callback(oldState));
  } else {
    store.addToStore(key, value);
  }

  if (runQueries) {
    counter += 1;

    if (server) socket.emit('set', { key, value, runQueries, counter });

    cache[counter] = {
      method: 'set', arguments: { key, value, runQueries, counter }, callback,
    };
  }
};

export const query = (key, callback, value) => {
  counter += 1;
  if (server) socket.emit('query', { key, value, counter });

  cache[counter] = { method: 'query', arguments: { key, value, counter }, callback };
};
