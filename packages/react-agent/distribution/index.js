'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getStore = exports.get = exports.set = exports.emit = exports.on = exports.query = exports.Agent = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // require("babel-polyfill");

var uuidv4 = require('uuid/v4');

var Store = function (_Component) {
  _inherits(Store, _Component);

  function Store(props) {
    _classCallCheck(this, Store);

    var _this = _possibleConstructorReturn(this, (Store.__proto__ || Object.getPrototypeOf(Store)).call(this, props));

    _this.state = props.store;
    return _this;
  }

  _createClass(Store, [{
    key: 'addToStore',
    value: function addToStore(key, value) {
      this.setState(_defineProperty({}, key, value));
    }
  }, {
    key: 'render',
    value: function render() {
      return (0, _react.cloneElement)(this.props.children);
    }
  }]);

  return Store;
}(_react.Component);

var store = void 0,
    socket = _socket2.default.connect();
var cache = {};
var subscriptions = {};
var logger = false;

window.addEventListener('online', function () {
  socket = _socket2.default.connect();
});

socket.on('connect', function () {
  Object.values(cache).forEach(function (_ref) {
    var key = _ref.key,
        request = _ref.request,
        queryId = _ref.queryId;

    socket.emit('query', { key: key, request: request, queryId: queryId });
  });
});

socket.on('response', function (data) {
  if (cache[data.queryId]) {
    if (data.preError) cache[data.queryId].reject(data.preError);else if (data.databaseError) cache[data.queryId].reject(data.databaseError);else cache[data.queryId].resolve(data.response);
    delete cache[data.queryId];
  }
});

socket.on('subscriber', function (data) {
  subscriptions[data.key].func(data.response);
});

var Agent = exports.Agent = function Agent(props) {
  store = new Store(props);
  if (props.logger && props.logger === 'true') logger = true;
  return store;
};

var query = exports.query = function query(key, request) {
  var queryId = uuidv4();
  if (logger) {
    if (!request) request = "none";
    console.log('Query: ', key, '\nRequest: ', request, '\nID: ', queryId);
  };
  socket.emit('query', { key: key, request: request, queryId: queryId });
  return new Promise(function (resolve, reject) {
    cache[queryId] = { key: key, request: request, queryId: queryId, resolve: resolve, reject: reject };
  });
};

var on = exports.on = function on(key, func) {
  if (logger) console.log('On: ', key);
  socket.emit('subscribe', { key: key });
  subscriptions[key] = { func: func };
};

var emit = exports.emit = function emit(key, request) {
  var queryId = uuidv4();
  if (logger) {
    if (!request) request = "none";
    console.log('Emit: ', key, '\nRequest: ', request, '\nID: ', queryId);
  };
  socket.emit('emit', { key: key, request: request, queryId: queryId });
  return new Promise(function (resolve, reject) {
    cache[queryId] = { key: key, request: request, queryId: queryId, resolve: resolve, reject: reject };
  });
};

var set = exports.set = function set() {
  var _console;

  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (logger) (_console = console).log.apply(_console, ['Set: '].concat(args));
  for (var i = 0; i < args.length; i = i + 2) {
    if (i + 1 === args.length) store.addToStore(args[i], null);else store.addToStore(args[i], args[i + 1]);
  }
};

var get = exports.get = function get() {
  var _console2;

  for (var _len2 = arguments.length, keys = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    keys[_key2] = arguments[_key2];
  }

  if (logger) (_console2 = console).log.apply(_console2, ['Get: '].concat(keys));
  if (keys.length > 1) {
    var results = {};
    keys.forEach(function (key) {
      return results[key] = store.state[key];
    });
    return results;
  } else {
    if (keys[0] === 'store') {
      return store.state;
    } else {
      return store.state[keys[0]];
    }
  }
};

var getStore = exports.getStore = function getStore() {
  return store;
};