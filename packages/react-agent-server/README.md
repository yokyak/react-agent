# React Agent Server

[![License](https://img.shields.io/github/license/yokyak/react-agent.svg)](https://github.com/yokyak/react-agent/blob/master/LICENSE.txt)
[![React Agent Server](https://img.shields.io/npm/v/react-agent-server.svg)](https://www.npmjs.com/package/react-agent-server)
[![Build Status](https://travis-ci.org/yokyak/react-agent.svg?branch=master)](https://travis-ci.org/yokyak/react-agent)
[![Coverage Status](https://coveralls.io/repos/github/yokyak/react-agent/badge.svg)](https://coveralls.io/github/yokyak/react-agent)

React Agent synchronizes client-side and server-side state.  It can be included in any React project without conflict with other state management tools or REST APIs.

React Agent is easy to learn.

Here's the basic idea: the client runs 'actions' that are defined on the server-side.

```javascript
run('addUser', { user: 'Billy' })
```

These actions can be as powerful as you want -- i.e. CRUD operations, API calls, and authentication. Moreover, clients can subscribe to server-side actions so that they  receive live updates.

React Agent includes offline-support to render optimistic updates and then synchronization on reestablished network connection. It also features time travel debugging.

*Why use React Agent?*

The popular conceptualization of state management stores state in two places: data on the client-side and data on the server-side.

To connect these, front-end and back-end developers usually write a lot of code such as HTTP requests, controllers, and routes. It can get complicated.
![previous](https://raw.githubusercontent.com/yokyak/react-agent/master/docs/imgs/diagram-before.gif)

In contrast, React Agent serves as a communication channel between the client and the server. It abstracts state transfer to make it super easy to interact between the client and server.
![now](https://raw.githubusercontent.com/yokyak/react-agent/master/docs/imgs/diagram-after.gif)

# Getting Started

This guide is focused on server-side usage of React Agent, although it includes necessary details to know about client-side usage. See [React Agent](https://github.com/yokyak/react-agent/tree/master/packages/react-agent) for more information about client-side set-up.

## Installing

Install the package:

```bash
npm install react-agent-server --save
```

## How to use

First, `require` React Agent Server into your server-side script.

```javascript
const agent = require('react-agent-server')
```

The `agent` method is called with a server, actions and database object.

```javascript
const server = http.createServer(fn).listen(3000)

const actions = {
  getMessages: {
    action: 'SELECT * FROM posts'
  }
}

const database = {
  name: 'billy',
  user: 'billy-user',
  password: 'billy-pw',
  dialect: 'postgres',
  host: 'rabbit.db.elephantsql.com',
  port: 3421
}

agent(server, actions, database)
```
With this setup, whenever `run('getMessages')` is called from the client-side (via React Agent), the corresponding SQL query ("SELECT * FROM posts") under the `action` property for `getMessages` will be ran. The results of this SQL query will be returned to the client.

It is possible to log what React Agent is doing by passing `true` as the fourth argument for `agent`. This feature can be helpful for debugging.

As a best practice, a callback can also be added to inspect and modify the direct response from the SQL database. Whatever is returned from this callback is what gets sent back to the client. Call `console.log` on the response to see the SQL results.

```javascript
const actions = {
  getMessages: {
    action: 'SELECT * FROM posts',
    callback: response => {
      console.log(response)
      return { messages: response[0] }
    }
  }
}
```

In the event of a database error, a custom error message can be sent back to the client. This error message is passed into the client promise rejection so it will appear in a `catch` block. If an error message is not included, React Agent uses its default error messages. 

```javascript
const actions = {
  getMessages: {
    action: 'SELECT * FROM posts',
    callback: response => ({ messages: response[0] }),
    errorMessage: 'Problem retrieving messages.'
  }
}
```

A `pre` property can be used to run any number of functions before the action is ran. This is an easy way to provide validation functions or modify the request object sent from the client in any way before it's passed to the action. Just return the request object and it will get passed into the next function. If any of these functions return false, the promise that the client-side `run` method returns will be rejected and the action will not run.

```javascript
login: {
    pre: [
      request => {
        if (request.cookie1 === '123') return request
        else return false
      },
      request => {
        if (request.cookie2 === '456') return request
        else return false
      }
    ],
    action: 'SELECT username, _id FROM users WHERE username = :user AND password = :password',
    callback: response => ({ username: response[0][0].username, id: response[0][0]._id })
  }
```

In the action property above, two properties from our request object from the client will be injected into the SQL string. This is done by using `:` followed by the request object property name. For example, if the client-side `run` call looked like this:

```javascript
run('login', { user: 'Bob', password: 'superstrongpassword' })
```

Then the appropriate values with those property names will be injected into the SQL string. React Agent uses Sequelize under the hood, which handles input sanitization protecting against many different types of SQL injection attacks.

Arbitrary functions can also be ran instead of using a SQL query string. The function will be passed both a `resolve` and `reject` argument (from a `new Promise` within the library), along with the request object passed in from the client-side `run` call. The use of a promise makes dealing with asynchronous code in the action easy. (If a function is ran, the action does not take a callback.)

```javascript
const actions = {
  getPlanet: {
    action: (resolve, reject, request) => {
      const url = request.url
      fetch(url, (error, response, body) => {
        if (error) reject(error)
        else resolve(body)
      })
    }
  }
}
```

## Contributors

### Authors

* **Tom Rosenblatt** - [https://github.com/tskittles](https://github.com/tskittles)

* **Eric Choi** - [https://github.com/eric2turbo](https://github.com/eric2turbo)

* **Henry Au** - [https://github.com/hhau01](https://github.com/hhau01)

* **Andrew Harris** - [https://github.com/didrio](https://github.com/didrio)

## License

This project is licensed under the MIT License - see the [LICENSE.txt](./../../LICENSE.txt) file for details.
