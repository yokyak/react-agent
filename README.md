# React Agent Server

This is the server-side library for React Agent where SQL queries can be written that correspond to keys triggered from the client-side React app. 

```javascript
const agent = require('react-agent-server');
```

The `agent` function is called with a server, database and query object. 

```javascript
const server = app.listen(3000);

const database = {
  name: process.env.NAME,
  user: process.env.USER,
  password: process.env.PASSWORD,
  dialect: 'postgres',
  host: process.env.HOST,
  port: process.env.PORT
};

const queries = {
  getMessages: {
    query: 'SELECT * FROM posts'
  }
};

agent(server, db, queries);
```
With this setup, whenever `query('getMessages')` is called from the client-side (via react-agent), the corresponding SQL query under the `query` key for `getMessages` will be ran. 

A callback can also be added to inspect and modify the direct response from the SQL database. Whatever is returned from this callback is what gets sent back to the client.

```javascript
const queries = {
  getMessages: {
    query: 'SELECT * FROM posts'
  },
  callback: response => ({ messages: response[0] })
};
```

In the event of a database error, a custom error message can be sent back to the client. The default error message is 'Error with database'. 

```javascript
const queries = {
  getMessages: {
    query: 'SELECT * FROM posts'
  },
  callback: response => ({ messages: response[0] }),
  errorMessage: 'Problem retrieving messages.'
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