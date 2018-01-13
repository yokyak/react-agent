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
      if (data.key) store.addToStore(data.key, data.response);
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

export const set = (key, value, serverObj) => {  
  store.addToStore(key, value);
  if (serverObj) {
    counter += 1;
    if (server) socket.emit('set', { key, value, serverObj, counter });
    cache[counter] = {
      method: 'set', arguments: { key, value, serverObj, counter }
    };
  }
};

export const query = (key, serverObj, callback) => {
  counter += 1;
  if (server) socket.emit('query', { key, serverObj, counter });
  if (typeof serverObj !== 'function' && typeof callback !== 'function') {
    return new Promise((resolve, reject) => {
      cache[counter] = { method: 'query', arguments: { key, value, serverObj, counter }, callback: resolve };
    });
  } else {
    if (typeof serverObj === 'function') callback = serverObj;
    cache[counter] = { method: 'query', arguments: { key, serverObj, counter }, callback };
  }
};

// This method is currently only used for the Mocha/Chai tests
export const getStore = () => {
  return store;
}