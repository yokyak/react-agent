# React Agent Server

React Agent synchronizes client-side state and server-side data. It can be included in any React project without conflict with other state management tools or REST APIs.

With React Agent’s library, a data-mutation on the client-side also updates the server’s database. And on the server-side, database mutations also update the state of subscribed clients. React Agent can also be used as solely a client-side store for state.

It features offline-support to render optimistic updates and then synchronization on reestablished network connection.

*Why use React Agent?*

The popular conceptualization of state management stores state in two places: data on the client-side and data on the server-side. To connect these, front-end and back-end developers usually write a lot of code such as HTTP requests, controllers, and routes. It can get complicated.

## Getting Started

This guide is focused on server-side usage of React Agent, although it includes necessary details to know about client-side usage. See [React Agent](https://github.com/yokyak/react-agent/tree/master/packages/react-agent) for more information about client-side set-up.

## Installing

Install the package:

```bash
npm install react-agent-server --save
```

## How to use

First `require` React Agent Server into your server-side script.

```javascript
const agent = require('react-agent-server');
```

The `agent` function is called with a server, database and queries object.

```javascript
const server = app.listen(3000);

const database = {
  name: 'billy',
  user: 'billy-user',
  password: 'billy-pw',
  dialect: 'postgres',
  host: 'rabbit.db.elephantsql.com',
  port: 3421
};

const queries = {
  getMessages: {
    query: 'SELECT * FROM posts'
  }
};

agent(server, database, queries);
```
With this setup, whenever `query('getMessages')` is called from the client-side (via react-agent), the corresponding SQL query under the `query` key for `getMessages` will be ran.

A callback can also be added to inspect and modify the direct response from the SQL database. Whatever is returned from this callback is what gets sent back to the client. Calling `console.log` on the response would be the easiest way to see the SQL results.

```javascript
const queries = {
  getMessages: {
    query: 'SELECT * FROM posts',
    callback: response => ({ messages: response[0] })
  }
};
```

In the event of a database error, a custom error message can be sent back to the client. The default error message is 'Error with database'.

```javascript
const queries = {
  getMessages: {
    query: 'SELECT * FROM posts',
    callback: response => ({ messages: response[0] }),
    errorMessage: 'Problem retrieving messages.'
  }
};
```
In the react-agent client-side script, any call to `set` will by default also look for the same key on the server, much like `query`. However, calls to `set` also subscribe to a specific SQL query under the same key that can be triggered by other clients. This SQL query is the value for `response`.

For example:

```javascript
const queries = {
  messages: {
    query: 'INSERT INTO posts VALUES (?, ?)',
    response: 'SELECT * FROM posts',
    callback: response => response[0]
  }
};
```

Upon calling `set('messages', message)` on the client-side, the client is now also subscribed to the `response` SQL query. If any other clients call `set('messages', message)` past that point, they are then pushed the response from that SQL query. This is what allows for real-time SQL updates to be pushed to clients. In this situation, the callback is actually performed on the response from `response`.

A `pre` key can be used to run any number of functions before the SQL query is ran. If any of these functions return false, a `validationError` will be attached as a property to the object passed into the client's `query` callback and the SQL query will not run. If all functions return true, everything will run as normal.

```javascript
login: {
    pre: [request => request.val1, request => request.val2],
    query: 'SELECT username, _id FROM users WHERE username = ? AND password = ?',
    callback: response => ({ username: response[0][0].username, id: response[0][0]._id })
  }
```

The `request` object passed into each function is from the last parameter of the client-side `query` call.

Arbitrary functions can also be ran without needing a SQL query. If all that's defined on a key is a callback, that callback will be passed a `resolve` and `reject` function (from a `new Promise` within the library) along with any values passed in from the client-side `query` call. The use of Promises makes dealing with asynchronous code in the callback easy.

```javascript
const queries = {
  getPlanet: {
    callback: (resolve, reject, values) => {
      const url = values[0];
      request(url, (error, response, body) => {
        if (error) reject(error);
        else resolve(body);
      });
    }
  }
};
```