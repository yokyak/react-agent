import React, { Component, cloneElement } from 'react';
import io from 'socket.io-client';
import { dispatch, createStore, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { log } from 'util';
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
    if (initialStore && Object.keys(this.props.props.reduxStore).length === 0) {
      return <div></div>;
    } else
    return this.props.props.props.children;
  }
}

class ReduxWrapper extends Component {

  renderStore() {
    MainStore = <AgentStore props={this.props} />;
    return MainStore;
  }

  render() {
    return this.renderStore();
  }
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
    if (server && testing) io.connect(port);
    else if (server) socket = io.connect();
  });
}

export const Agent = (props) => {
  if (props.hasOwnProperty('store')) initialStore = true;
  if (props.logger && typeof props.logger !== 'function') logger = true;
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
  if (logger) logHelper('run', keys, request, actionId);
  socket.emit('run', { keys, request, actionId, socketID: socket.id });
  return new Promise((resolve, reject) => {
    cache[actionId] = { method: 'query', keys, request, actionId, resolve, reject, socketID: socket.id };
  });
};

export const on = (key, func) => {
  if (!server) setupSocket();
  if (logger) logHelper('on', key);
  const actionId = uuidv4();
  cache[actionId] = { method: 'subscribe', key, actionId }
  socket.emit('subscribe', { key, actionId });
  subscriptions[key] = { func };
};

export const unsubscribe = (key) => {
  if (!server) setupSocket();
  if (logger) logHelper('unsubscribe', key);
  const actionId = uuidv4();
  cache[actionId] = { method: 'unsubscribe', key, actionId };
  socket.emit('unsubscribe', { key, actionId });
  delete subscriptions[key];key
};

export const emit = (key, request) => {
  if (!server) setupSocket();
  const actionId = uuidv4();
  if (logger) logHelper('emit', key, request, actionId);
  socket.emit('emit', { key, request, actionId, socketID: socket.id });
  return new Promise((resolve, reject) => {
    cache[actionId] = { method: 'query', key, request, actionId, resolve, reject, socketID: socket.id };
  });
};

export const set = (...args) => {
  if (args.length === 1 && typeof args[0] === 'object') {
    if (logger) logHelper('setSingle', args[0]);
    MainStore.props.props.addToReduxStore(args[0]);
  } else {
    if (logger) logHelper('setMulti', args);
    for (let i = 0; i < args.length; i = i + 2) {
      if (i + 1 === args.length) MainStore.props.props.addToReduxStore({ [args[i]]: null });
      else MainStore.props.props.addToReduxStore({ [args[i]]: args[i + 1] });
    }
  }
};

export const get = (...keys) => {
  if (logger) logHelper('get', keys);
  if (keys.length === 0) return MainStore.props.props.reduxStore;
  else if (keys.length > 1) {
    const results = {};
    keys.forEach(key => results[key] = MainStore.props.props.reduxStore[key]);
    return results;
  } else return MainStore.props.props.reduxStore[keys[0]];
};

export const destroy = (...keys) => {
  if (logger) logHelper('destroy', keys);
  keys.forEach(key => MainStore.props.props.deleteFromReduxStore(key));
};

export const isOfflineCacheEmpty = () => Object.keys(cache).length === 0;

export const getCache = () => cache;

export const getStore = () => MainStore.props.props.reduxStore;

export const getStoreComponent = () => MainStore;

const setupSocket = () => {
  server = true;
  if (testing) socket = io.connect(port);
  else socket = io.connect();

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

  socket.on('subscriber', data => {
    subscriptions[data.key].func(data.response);
  });

  socket.on('emitOnUnsubscribeResponse', data => {
    delete cache[data.actionId];
  });
}

// Consolidate the various logger messages into a single function
const logHelper = (msg, ...etc) => {
  if (msg === 'run') {
    let request;
    etc[0] ? request = etc[1] : request = "none";
    if (typeof logger !== 'function') {
      console.log('Run: ', etc[0], '\nRequest: ', request, '\nID: ', etc[2]);
    };
    if (typeof logger === 'function') {
      if(!request) request = "none";
      logger('Run: ' + etc[0] + 'Request: ' + request + 'ID: ' + etc[2]);
    };
  }
  if (msg === 'on') {
    if (typeof logger !== 'function') console.log('On: ', etc[0]);
    if (typeof logger === 'function') logger('On: ' + etc[0]);
  }
  if (msg === 'unsubscribe') {
    if (typeof logger !== 'function') console.log('Unsubscribe: ', etc[0]);
    if (typeof logger === 'function') logger('Unsubscribe: ' + etc[0]);
  }
  if (msg === 'emit') {
    let request;
    !etc[1] ? request = "none" : request = etc[1];
    if (logger && typeof logger !== 'function') {
      console.log('Emit: ', etc[0], '\nRequest: ', request, '\nID: ', etc[2]);
    };
    if (logger && typeof logger === 'function') {
      logger('Emit: ' + etc[0] + 'Request: ' + request + 'ID: ' + etc[2]);
    };
  }
  if (msg === 'setSingle') {
    if (typeof logger !== 'function') console.log('Set: ', etc[0]);
    if (typeof logger === 'function') logger('Set: ' + etc[0]);
  }
  if (msg === 'setMulti') {
    if (typeof logger !== 'function') console.log('Set: ', ...etc[0]);
    if (typeof logger === 'function') logger('Set: ' + JSON.stringify(etc[0]));
  }
  if (msg === 'get') {
    if (typeof logger !== 'function') console.log('Get: ', ...etc[0]);
    if (typeof logger === 'function') logger('Get: ' + JSON.stringify(etc[0]));
  }
  if (msg === 'destroy') {
    if (logger && typeof logger !== 'function') console.log('Destroy: ', ...etc[0]);
    if (logger && typeof logger === 'function') logger('Destroy: ' + JSON.stringify(etc[0]));
  }
}