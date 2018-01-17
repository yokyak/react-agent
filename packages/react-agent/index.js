import React, { Component, cloneElement } from 'react';
import io from 'socket.io-client';
const uuidv4 = require('uuid/v4');

class Store extends Component {
  constructor(props) {
    super(props);
    this.state = props.store;
  }

  addToStore(key, value) { this.setState({ [key]: value }) }

  render() { return cloneElement(this.props.children) }
}

let store, socket = io.connect();
const cache = {};
const subscriptions = {};
let logger = false;

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
  if (props.logger && props.logger === 'true') logger = true;
  return store;
}

export const query = (key, request) => {
  const queryId = uuidv4();
  if (logger) {
    if(!request) request = "none";
    console.log('Query: ', key, '\nRequest: ', request, '\nID: ', queryId);
  };
  socket.emit('query', { key, request, queryId });
  return new Promise((resolve, reject) => {
    cache[queryId] = { key, request, queryId, resolve, reject };
  });
};

export const on = (key, func) => {
  if (logger) console.log('On: ', key);
  socket.emit('subscribe', { key });
  subscriptions[key] = { func };
};

export const unsubscribe = (key) => {
  if (logger) console.log('Unsubscribe: ', key);
  socket.emit('unsubscribe', { key });
  delete subscriptions[key];
};

export const emit = (key, request) => {
  const queryId = uuidv4();
  if (logger) {
    if(!request) request = "none";
    console.log('Emit: ', key, '\nRequest: ', request, '\nID: ', queryId);
  };
  socket.emit('emit', { key, request, queryId });
  return new Promise((resolve, reject) => {
    cache[queryId] = { key, request, queryId, resolve, reject };
  });
};

export const set = (...args) => {
  if (logger) console.log('Set: ', ...args);
  for (let i = 0; i < args.length; i = i + 2) {
    if (i + 1 === args.length) store.addToStore(args[i], null);
    else store.addToStore(args[i], args[i + 1]);
  }
};

export const get = (...keys) => {
  if (logger) console.log('Get: ', ...keys);
  if (keys.length === 0) return store.state;
  else if (keys.length > 1) {
    const results = {};
    keys.forEach(key => results[key] = store.state[key]);
    return results;
  } else return store.state[keys[0]];
};

export const getStore = () => store.state;
export const getStoreComponent = () => store;
