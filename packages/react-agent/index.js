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
  return new Promise((resolve, reject) => {
    cache[actionId] = { keys, request, actionId, resolve, reject, socketID: socket.id };
  });
};

export const on = (key, func) => {
  if (!server) setupSocket();
  if (logger && typeof logger !== 'function') console.log('On: ', key);
  if (logger && typeof logger === 'function') logger('On: ' + key);
  socket.emit('subscribe', { key });
  subscriptions[key] = { func };
};

export const unsubscribe = (key) => {
  if (!server) setupSocket();
  if (logger && typeof logger !== 'function') console.log('Unsubscribe: ', key);
  if (logger && typeof logger === 'function') logger('Unsubscribe: ' + key);
  socket.emit('unsubscribe', { key });
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
  return new Promise((resolve, reject) => {
    cache[actionId] = { key, request, actionId, resolve, reject, socketID: socket.id };
  });
};

export const set = (...args) => {
  if (args.length === 1 && typeof args[0] === 'object') {
    if (logger && typeof logger !== 'function') console.log('Set: ', args[0]);
    if (logger && typeof logger === 'function') logger('Set: ' + args[0]);
    MainStore.props.props.addToReduxStore(args[0]);
  } else {
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

const setupSocket = () => {
  server = true;
  if (testing) socket = io.connect(port);
  else socket = io.connect();

  socket.on('connect', () => {
    Object.values(cache).forEach(({ key, request, actionId, socketID }) => {
      socket.emit('query', { key, request, actionId, socketID });
    });
  });
  socket.on('response', data => {
    let actionId = data.actionId;
    let response = data.response;

    // if multiple actions are run at once (i.e. run([__, __]) an object containing each response will be returned
    // each response in the returned object will have the same the action id
    if (!data.hasOwnProperty('actionId')) {
      const keys = Object.keys(data);
      actionId = data[keys[0]].actionId;
      keys.forEach(key => {
        if (data[key].preError) data[key] = data[key].preError;
        else if (data[key].databaseError) data[key] = data[key].databaseError;
        else if (data[key].actionError) data[key] = data[key].actionError;
        else data[key] = data[key].response;
      });
      response = data;
    }
    if (cache[actionId]) {
      if (data.preError) cache[actionId].reject(data.preError);
      else if (data.databaseError) cache[actionId].reject(data.databaseError);
      else if (data.actionError) cache[actionId].reject(data.actionError);
      else cache[actionId].resolve(response);
      delete cache[actionId];
    }
  });

  socket.on('subscriber', data => {
    subscriptions[data.key].func(data.response);
  });

  socket.on('emitResponse', data => {
    delete cache[data.actionId];
  });
}
