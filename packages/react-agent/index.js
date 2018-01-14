import React, { Component, cloneElement } from 'react';
import io from 'socket.io-client';
const uuidv4 = require('uuid/v4');

class Store extends Component {
  constructor(props) {
    super(props);
    this.state = props.store;
  }

  addToStore(key, value) { this.setState({ [key]: value }) }

  render() { return cloneElement(this.props.children, this.state) }
}

let store, socket = io.connect();
const cache = {};
const subscriptions = {};

window.addEventListener('online', () => {
  socket = io.connect();
});

socket.on('connect', () => {
  Object.values(cache).forEach(({ key, request, queryId }) => {
    socket.emit('query', { key, request, queryId });
  });
});

socket.on('response', data => {
  if (cache[data.queryId]) {
    if (data.preError) cache[data.queryId].reject(data.preError);
    else if (data.databaseError) cache[data.queryId].reject(data.databaseError);
    else cache[data.queryId].resolve(data.response);
    delete cache[data.queryId];
  }
});

socket.on('subscriber', data => { subscriptions[data.key].func(data.response) });

export const Agent = (props) => {
  store = new Store(props);
  return store;
}

export const query = (key, request) => {
  const queryId = uuidv4();
  socket.emit('query', { key, request, queryId });
  return new Promise((resolve, reject) => {
    cache[queryId] = { key, request, queryId, resolve, reject };
  });
};

export const subscribe = (key, func) => {
  socket.emit('subscribe', { key });
  subscriptions[key] = { func };
};

export const emit = (key, request) => {
  const queryId = uuidv4();
  socket.emit('emit', { key, request, queryId });
  return new Promise((resolve, reject) => {
    cache[queryId] = { key, request, queryId, resolve, reject };
  });
};

export const set = (...args) => {
  if (args.length % 2 !== 0) throw new Error(`React Agent: 'set' must have an even amount of arguments.`);
  else {
    for (let i = 0; i < args.length; i = i + 2) {
      store.addToStore(args[i], args[i + 1]);
    }
  }
};

export const get = (key) => store.state[key];

export const getStore = () => store;