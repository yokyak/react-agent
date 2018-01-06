import React, { Component, cloneElement } from 'react';
import io from 'socket.io-client';

class Store extends Component {
  constructor(props) {
    super(props);
    this.state = {
      _cachedRequests: {}
    }
  }

  addToStore(key, value) {
    this.setState({ [key]: value });
  }

  render() {
    return cloneElement(this.props.children, this.state);
  }
}

let store, socket, currentCallback;

export const Agent = (props) => {
  socket = io(props.url);

  socket.on('response', data => {
    set(data.key, data.response, false);
  });

  socket.on('queryResponse', data => {
    // _cachedRequests[data.timestamp] = null;
    currentCallback(data);
  });

  store = new Store;
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
  socket.emit('set', { key, value, runQueries });
}

export const query = (key, callback, values) => {
  socket.emit('query', { key, values });
  // const timestamp = Date.now();
  // _cachedRequests[timestamp] = { key, callback, values, timestamp };
  currentCallback = callback;
}
