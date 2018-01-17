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

const cache = {}, subscriptions = {};
let store, socket, server = false, logger = false;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (server) socket = io.connect();
  });
}

export const Agent = (props) => {
  store = new Store(props);
  if (props.logger && props.logger === 'true') logger = true;
  return store;
}

export const run = (key, request) => {
  if (!server) setupSocket();
  const actionId = uuidv4();
  if (logger) {
    if(!request) request = "none";
    console.log('Run: ', key, '\nRequest: ', request, '\nID: ', actionId);
  };
  socket.emit('run', { key, request, actionId });
  return new Promise((resolve, reject) => {
    cache[actionId] = { key, request, actionId, resolve, reject };
  });
};

export const on = (key, func) => {
  if (!server) setupSocket();
  if (logger) console.log('On: ', key);
  socket.emit('subscribe', { key });
  subscriptions[key] = { func };
};

export const unsubscribe = (key) => {
  if (!server) setupSocket();
  if (logger) console.log('Unsubscribe: ', key);
  socket.emit('unsubscribe', { key });
  delete subscriptions[key];
};

export const emit = (key, request) => {
  if (!server) setupSocket();
  const actionId = uuidv4();
  if (logger) {
    if(!request) request = "none";
    console.log('Emit: ', key, '\nRequest: ', request, '\nID: ', actionId);
  };
  socket.emit('emit', { key, request, actionId });
  return new Promise((resolve, reject) => {
    cache[actionId] = { key, request, actionId, resolve, reject };
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

const setupSocket = () => {
  server = true;
  socket = io.connect();
  socket.on('connect', () => {
    Object.values(cache).forEach(({ key, request, actionId }) => {
      socket.emit('query', { key, request, actionId });
    });
  });
  socket.on('response', data => {
    if (cache[data.actionId]) {
      if (data.preError) cache[data.actionId].reject(data.preError);
      else if (data.databaseError) cache[data.actionId].reject(data.databaseError);
      else cache[data.actionId].resolve(data.response);
      delete cache[data.actionId];
    }
  });
  socket.on('subscriber', data => { subscriptions[data.key].func(data.response) });
}
