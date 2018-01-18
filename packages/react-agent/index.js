import React, { Component, cloneElement } from 'react';
import io from 'socket.io-client';
import { dispatch, createStore, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';
import { composeWithDevTools } from 'redux-devtools-extension';
const uuidv4 = require('uuid/v4');

const cache = {}, subscriptions = {};
let MainStore, socket, server = false, logger = false, providerStore, initialStore = false;

const actionCreator = (object) => {
  return {
    type: Object.keys(object)[0],
    payload: object
  }
}

const mapStateToProps = store => ({
  reduxStore: store.reduxStore
});

const mapDispatchToProps = dispatch => ({
  addToReduxStore: object => dispatch(actionCreator(object))
});

const storeReducer = (state = {}, action) => {
  return Object.assign({}, state, action.payload);
}

const reducers = combineReducers({
  reduxStore: storeReducer
});

class AgentStore extends Component {
  componentWillMount() {
    if (initialStore) this.props.props.addToReduxStore(this.props.props.props.store);
  }
  render() {
    if (initialStore && Object.keys(this.props.props.reduxStore).length === 0) {
      return <div></div>;
    } else return this.props.props.props.children;
  }
}

class ReduxWrapper extends Component {

  renderStore() {
    MainStore = <AgentStore props={this.props} />;
    return MainStore;
  }

  render() { return this.renderStore() }
}

const RW = connect(mapStateToProps, mapDispatchToProps)(ReduxWrapper);

class ProviderWrapper extends Component {
  render() {
    return (
      <Provider store={providerStore} >
        <RW props={this.props} />
      </Provider>
    );
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (server) socket = io.connect();
  });
}

export const Agent = (props) => {
  if (props.hasOwnProperty('store')) initialStore = true;
  if (props.logger && props.logger === true) logger = true;
  if (props.devTools && props.devTools === true) {
    providerStore = createStore(reducers, composeWithDevTools());
  } else {
    providerStore = createStore(reducers);
  }
  return new ProviderWrapper(props);
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
  if (args.length === 1 && typeof args[0] === 'object') {
    if (logger) console.log('Set: ', args[0]);
    MainStore.props.props.addToReduxStore(args[0]);
  } else {
    if (logger) console.log('Set: ', ...args);
    for (let i = 0; i < args.length; i = i + 2) {
      if (i + 1 === args.length) MainStore.props.props.addToReduxStore({ [args[i]]: null });
      else MainStore.props.props.addToReduxStore({ [args[i]]: args[i + 1] });
    }
  }
};

export const get = (...keys) => {
  if (logger) console.log('Get: ', ...keys);
  if (keys.length === 0) return MainStore.props.props.reduxStore;
  else if (keys.length > 1) {
    const results = {};
    keys.forEach(key => results[key] = MainStore.props.props.reduxStore[key]);
    return results;
  } else return MainStore.props.props.reduxStore[keys[0]];
};

export const getStore = () => MainStore.props.props.reduxStore;

export const getStoreComponent = () => MainStore;

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
