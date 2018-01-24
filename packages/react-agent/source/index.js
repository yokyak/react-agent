import React, { Component, cloneElement } from 'react';
import io from 'socket.io-client';
import { dispatch, createStore, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';
import { composeWithDevTools } from 'redux-devtools-extension';
const uuidv4 = require('uuid/v4');

const cache = {}, subscriptions = {};
let MainStore, socket, port, server = false, logger = false, providerStore, initialStore = false, offlinePopUp = false, testing = false;

const addToReduxStore = (object) => {
  return {
    type: Object.keys(object)[0],
    payload: object
  }
}

const deleteFromReduxStore = (key) => {
  return {
    type: 'DESTROY: ' + key,
    payload: key
  }
}

const mapStateToProps = store => ({
  reduxStore: store.reduxStore
});

const mapDispatchToProps = dispatch => ({
  addToReduxStore: object => dispatch(addToReduxStore(object)),
  deleteFromReduxStore: object => dispatch(deleteFromReduxStore(object))
});

let newState;

const storeReducer = (state = {}, action) => {
  switch (action.type.slice(0, 7)) {
    case 'DESTROY':
      newState = Object.assign({}, state);
      delete newState[action.payload];
      return newState;
    default:
      return Object.assign({}, state, action.payload);
  }
}

const reducers = combineReducers({
  reduxStore: storeReducer
});

class AgentStore extends Component {
  // Call Redux action creator with initial store passed in by client
  componentWillMount() {
    if (initialStore) this.props.props.addToReduxStore(this.props.props.props.store);
  }

  componentDidMount() {
    if (offlinePopUp) {
      window.addEventListener('beforeunload', (ev) => {
        if (isOfflineCacheEmpty() === false) {
          const message = '';
          ev.returnValue = message;
          return message;
        }
      });
    }
  }

  componentWillUnmount() {
    if (offlinePopUp) {
      window.removeEventListener('beforeunload', (ev) => {
        if (isOfflineCacheEmpty() === false) {
          const message = '';
          ev.returnValue = message;
          return message;
        }
      });
    }
  }

  render() {
    // If an initial store was provided, wait for it to be set in Redux before rendering
    if (initialStore && Object.keys(this.props.props.reduxStore).length === 0) {
      return <div></div>;
    } else
    return this.props.props.props.children;
  }
}

class ReduxWrapper extends Component {

  // Setting a reference to a React component so its props (Redux store and methods) can be accessed
  renderStore() {
    MainStore = <AgentStore props={this.props} />;
    return MainStore;
  }

  render() {
    return this.renderStore();
  }
}

// The Redux store and the Redux action creators are connected here
const RW = connect(mapStateToProps, mapDispatchToProps)(ReduxWrapper);

// The entire application is wrapped with Redux's Provider
class ProviderWrapper extends Component {
  render() {
    return (
      <Provider store={providerStore} >
        <RW props={this.props} />
      </Provider>
    );
  }
}

export const Agent = (props) => {
  if (props.hasOwnProperty('store')) initialStore = true;
  if (props.logger && props.logger === true) logger = true;
  if (props.logger && typeof props.logger === 'function') logger = props.logger;
  if (props.devTools && props.devTools === true) {
    providerStore = createStore(reducers, composeWithDevTools());
  } else {
    providerStore = createStore(reducers);
  }
  if (props.offlinePopUp && props.offlinePopUp === true) {
    offlinePopUp = true;
  }
  if (props.testing) {
    testing = true;
    port = props.testing;
  }
  return new ProviderWrapper(props);
}

export const run = (keys, request) => {
  if (!Array.isArray(keys)) keys = [keys];
  if (!server) setupSocket();
  const actionId = uuidv4();
  if (logger && typeof logger !== 'function') {
    if(!request) request = "none";
    console.log('Run: ', keys, '\nRequest: ', request, '\nID: ', actionId);
  };
  if (logger && typeof logger === 'function') {
    if(!request) request = "none";
    logger('Run: ' + keys + 'Request: ' + request + 'ID: ' + actionId);
  };
  socket.emit('run', { keys, request, actionId, socketID: socket.id });

  // Pass the resolve and reject functions from the promise
  // to the cache so they can be called when the server responds
  return new Promise((resolve, reject) => {
    cache[actionId] = { method: 'query', keys, request, actionId, resolve, reject, socketID: socket.id };
  });
};

export const on = (key, func) => {
  if (!server) setupSocket();
  if (logger && typeof logger !== 'function') console.log('On: ', key);
  if (logger && typeof logger === 'function') logger('On: ' + key);
  const actionId = uuidv4();
  cache[actionId] = { method: 'subscribe', key, actionId }
  socket.emit('subscribe', { key, actionId });
  subscriptions[key] = { func };
};

export const unsubscribe = (key) => {
  if (!server) setupSocket();
  if (logger && typeof logger !== 'function') console.log('Unsubscribe: ', key);
  if (logger && typeof logger === 'function') logger('Unsubscribe: ' + key);
  const actionId = uuidv4();
  cache[actionId] = { method: 'unsubscribe', key, actionId };
  socket.emit('unsubscribe', { key, actionId });
  delete subscriptions[key];
};

export const emit = (key, request) => {
  if (!server) setupSocket();
  const actionId = uuidv4();
  if (logger && typeof logger !== 'function') {
    if(!request) request = "none";
    console.log('Emit: ', key, '\nRequest: ', request, '\nID: ', actionId);
  };
  if (logger && typeof logger === 'function') {
    if(!request) request = "none";
    logger('Emit: ' + key + 'Request: ' + request + 'ID: ' + actionId);
  };
  socket.emit('emit', { key, request, actionId, socketID: socket.id });

  // Pass the resolve and reject functions from the promise
  // to the cache so they can be called when the server responds
  return new Promise((resolve, reject) => {
    cache[actionId] = { method: 'query', key, request, actionId, resolve, reject, socketID: socket.id };
  });
};

export const set = (...args) => {
  if (args.length === 1 && typeof args[0] === 'object') {
    // If set with an object, just pass that to action creator
    if (logger && typeof logger !== 'function') console.log('Set: ', args[0]);
    if (logger && typeof logger === 'function') logger('Set: ' + args[0]);
    MainStore.props.props.addToReduxStore(args[0]);
  } else {
    // If comma seperated strings, loops through them and 
    // pass to action creator one by one
    if (logger && typeof logger !== 'function') console.log('Set: ', ...args);
    if (logger && typeof logger === 'function') logger('Set: ' + args);
    for (let i = 0; i < args.length; i = i + 2) {
      if (i + 1 === args.length) MainStore.props.props.addToReduxStore({ [args[i]]: null });
      else MainStore.props.props.addToReduxStore({ [args[i]]: args[i + 1] });
    }
  }
};

export const get = (...keys) => {
  if (logger && typeof logger !== 'function') console.log('Get: ', ...keys);
  if (logger && typeof logger === 'function') logger('Get: ' + keys);
  // Return the entire store if no arguments are provided
  if (keys.length === 0) return MainStore.props.props.reduxStore;
  else if (keys.length > 1) {
    const results = {};
    keys.forEach(key => results[key] = MainStore.props.props.reduxStore[key]);
    return results;
  } else return MainStore.props.props.reduxStore[keys[0]];
};

export const destroy = (...keys) => {
  if (logger) console.log('Destroy: ', ...keys);
  keys.forEach(key => MainStore.props.props.deleteFromReduxStore(key));
};

export const isOfflineCacheEmpty = () => Object.keys(cache).length === 0;

export const getCache = () => cache;

export const getStore = () => MainStore.props.props.reduxStore;

export const getStoreComponent = () => MainStore;

// This is only called if a server method is used,
// otherwise never try to connect with socket.io
const setupSocket = () => {
  server = true;
  if (testing) socket = io.connect(port);
  else socket = io.connect();

  // Always check the cache for pending requests
  // on a socket connection/reconnection
  socket.on('connect', () => {
    Object.values(cache).forEach(x => {
      if (x.method === 'query') socket.emit(x.method, { key : x.key, request: x.request, actionId: x.actionId, socketID: x.socketID });
      if (x.method === 'subscribe' || x.method === 'unsubscribe') socket.emit(x.method, { key : x.key, actionId: x.actionId });
    });
  });
  socket.on('response', data => {
    let actionId = data.actionId;
    let response = data.response;

    // if multiple actions are run at once (i.e. run([__, __]) an object containing each response will be returned
    // each response in the returned object will have the same action id
    if (!data.hasOwnProperty('actionId')) {
      const keys = Object.keys(data);
      actionId = data[keys[0]].actionId;
      keys.forEach(key => {
        if (data[key].preError) data[key] = data[key].preError;
        else if (data[key].databaseError) data[key] = data[key].databaseError;
        else if (data[key].actionError) data[key] = data[key].actionError;
        else if (data[key].keyError) data[key] = data[key].keyError;
        else data[key] = data[key].response;
      });
      response = data;
    }
    if (cache[actionId]) {
      if (data.preError) cache[actionId].reject(data.preError);
      else if (data.databaseError) cache[actionId].reject(data.databaseError);
      else if (data.actionError) cache[actionId].reject(data.actionError);
      else if (data.keyError) cache[actionId].reject(data.keyError);
      else cache[actionId].resolve(response);
      delete cache[actionId];
    }
  });

  // On a response from the server for a subscribed socket, 
  // call the function that was passed into the 'on' method
  socket.on('subscriber', data => {
    subscriptions[data.key].func(data.response);
  });

  socket.on('emitOnUnsubscribeResponse', data => {
    delete cache[data.actionId];
  });
}

// If in a browser (as opposed to a test), reconnect to socket.io 
// if the client goes offline then back online again
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (server && testing) io.connect(port);
    else if (server) socket = io.connect();
  });
}