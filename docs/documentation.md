# Documentation

Below is the documentation for React Agent and React Agent Server. If you're just getting started, it may be useful to read our [client](https://github.com/yokyak/react-agent/tree/master/packages/react-agent) and/or [server-side](https://github.com/yokyak/react-agent/tree/master/packages/react-agent-server) guides first. 

## Table Of Contents  
### Client-Side: React Agent 
  * [Agent](#AgentWrapper)   
  * [set](#set)  
  * [get](#get)  
  * [destroy](#destroy)  
  * [run](#run)  
  * [on](#on)  
  * [emit](#emit)  
  * [unsubscribe](#unsubscribe)  
  * [isOfflineCacheEmpty](#isOfflineCacheEmpty)  
  * [getStore](#getStore)  

### Server-Side: React Agent Server 
  * [agent](#server3)  
  * [pre](#pre)  
  * [action](#action)  
  * [callback](#callback)  
  * [errorMessage](#errorMessage)  

<a name="client"></a> 
# Client-Side: React Agent

<a name="AgentWrapper"></a>
## Agent
### Syntax
```javascript
render(
  <Agent attribute={value}>
    <App />
  </Agent>
  , document.querySelector(#root))
```
*Parameters*  
`<Agent>` wraps a higher order React component, `<App />`. It receives four *optional* arguments as  `attribute={value}`:  
  * `devTools={true}` - Enables time travel debugging via Redux Chrome Dev Tools. 
  * `store={initialStore}` - Sets React Agent's store with initial values by providing an object, `initialStore`.
  * `logger={true}` - Console logs what React Agent is doing on the client-side.
  * `offlinePopUp={true}` - Warns a user if they try to navigate away from the page with unexecuted server-side changes (such as in case of poor network connection).
### Description
The `<Agent>` wrapper is the initial set-up to make React Agent work throughout your app. Optionally, it can be configured to enable time travel debugging, a logger, an initial store, and a pop-up for unsaved changes. 
### Example
```javascript
const initialStore = {
 first: true,
 second: false,
 third: 'ok'
}

render(
 <Agent devTools={true} store={initialStore} logger={true} offlinePopUp={true}>
   <App />
 </Agent>
 , document.querySelector('#root'))
```

<a name="set"></a>
## set
### Syntax
```javascript
// the argument can be an object
set({ property1: value1 })
set({ property1: value1 [, property2: value2, ...] })

// arguments can be comma separated values
set(property1, value1)
set(property1, value1[, property2, value2, ...] )
```
*Parameters*   
An object with a variable number of properties.   
*or*  
`property` - A string.   
`value` -  Any value.
### Description
The `set` method creates a new object for React Agent's store (rather than mutating it directly). It uses 1) React's diffing algorithm for fast re-rendering, and 2) Redux for time travel debugging. 
### Example
```javascript
// set with an object
set({ name: 'Annie', age: 26 })

// set with multiple arguments
set('name', 'Annie', 'age', 26)

// add a new message by unpacking the previous messages and appending it
set({ messages: [...get('messages'), 'new message'] })
```

<a name="get"></a>
## get
### Syntax
```javascript
get(property)
```
*Parameters*  
`property` - A string referring to a property `set` in React Agent's store.

*Return value*  
The value of the `property` in React Agent's store.

### Description
The `get` method is used to retrieve a value from React Agent's store. If it is called without an argument, it returns the entire current state of the store. 
### Example
```javascript
get('currentUser') // returns 'Annie'
```

<a name="destroy"></a>
## destroy
### Syntax
```javascript
destroy(property)
```
*Parameters*  
`property` - A string referring to a property `set` in React Agent's store.
### Description
Deletes a property and its value from React Agent's store. 
### Example
```javascript
destroy('temporaryNumber')
```

<a name="run"></a>
## run
### Syntax
```javascript
// running a single action
run(key[, request ])

// running multiple actions
run([key1, key2, ...] [, request ])
```
*Parameters*  
`key` - A string that matches an action key defined on the server-side. Multiple `key`s can be listed in an array.  
`request` (optional) - An object that can be passed to the server-side action(s). If multiple actions are run, the same object is passed to all of the actions. 

*Return Value*  
A promise, which resolves or rejects based on the server's response.  
### Description
`run` executes an action or multiple actions on the server-side, and can optionally send a request object to those action(s). 
### Example
```javascript
// run a single action
run('addStudent', { name: 'Annie' })

// run multiple actions
run(['addStudent', 'addMessage'], { name: 'Annie', message: 'Trapped in a simulation' })
```

<a name="on"></a>
## on
### Syntax
```javascript
on(key, callback)
```
*Parameters*  
`key` - A string that matches an action key defined on the server-side.   
`callback` - A function that runs when an action is emitted by any client, receiving one argument:
  * `data` - The result of the server-side action.
### Description
The `on` method subscribes a client to an action key. That is, if `emit` is called with the corresponding action key, the server pushes the action's response to all subscribed clients.
### Example
```javascript
on('getMessages', data => {
  set('messages', data.messages)
})
```
<a name="emit"></a>
## emit
### Syntax
```javascript
emit(key[, request])
```
*Parameters*  
`key` - A string that matches an action key defined on the server-side.   
`request` (optional) - An object that is passed to the server-side action.
### Description
The `emit` method pushes an update from the server to any client who has subscribed to the corresponding action key. 
### Example
```javascript
emit('getMessages', { cookieId: '123' })
```

<a name="unsubscribe"></a>
## unsubscribe
### Syntax
```javascript
unsubscribe(key)
```
*Parameters*  
`key` - A string that matches an action key defined on the server-side. 
### Description
The `unsubscribe` method unsubscribes a client from emitted updates for an action key.
### Example
```javascript
unsubscribe('getMessages')
```

<a name="isOfflineCacheEmpty"></a>
## isOfflineCacheEmpty
### Syntax
```javascript
isOfflineCacheEmpty()
```
*Return Value*  
A boolean indicating whether React Agent's cache is empty. 
### Description
The `isOfflineCacheEmpty` method assesses the current state of the client cache. The cache is used to store client requests to the server. Once a request is completed on the server, it is deleted from the client cache. 

This method can be useful to determine if the client has unsaved changes; that is, requests that need to be sent to the server. For example, if network connection is offline and a user continues to interact with the website via optimistic updates, the cache may not be empty; `isOfflineCacheEmpty()` may return `false`. Once the network connection returns, the cache would successfully resend any client requests made in the interim; `isOfflineCacheEmpty()` would return `true`. 

Also, consider including the flag `offlinePopUp={true}` in `<Agent>` for an automatic pop-up if a user tries to navigate away from the site with unsaved progress. This pop-up uses `isOfflineCacheEmpty` under the hood.

### Example
```javascript
if (!isOfflineCacheEmpty()) {
  // warn if a user tries to navigate away from page
}
```

<a name="getStore"></a>
## getStore
### Syntax
```javascript
getStore() 
```
*Return Value*  
An object representing the current state of React Agent's store. 
### Description
The `getStore` method returns the entire current state of React Agent's store. Alternatively, use `get()` for the same result.
### Example
```javascript
const currentStore = getStore()
```

# Server-Side: React Agent Server

<a name="server3"></a>
## agent
### Syntax
```javascript
agent(server, actions[, database[, logger[, runs ] ] ] )
```
*Parameters*  
`server` - a Node/Express server.  
`actions` - a nested object where each entry is a key indicating the name of the action, and a value of an object containing the properties `pre` (optional), `action` (required), `callback` (optional), and `errorMessage` (optional).  
`database` (optional) - an object containing the information necessary to connect to a database. It requires the six properties:
  * `name`
  * `user`
  * `password`
  * `dialect` - the value should be `'mysql'`, `'sqlite'`, `'postgres'`, or `'mssql'`, depending on the type of database management system.
  * `host`
  * `port`  

`logger` (optional) - either a boolean or a function. If `true` is provided, React Agent will log in the console what it is doing. If a function is provided, React Agent will pass the logger messages to the function that is provided.  
`runs` (optional) - an object that enables server-side actions to be run independent of the front end. Each property is the key of the action that is being tested, and each respective value is the value being passed to the action from the client, if applicable. If a value is not being passed from the client, the value should be null. 

### Description
The `agent` method is the initial set-up to get React Agent Server working on the server-side. 

It includes functionality for 1) Postman-style testing so that server-side actions can be run independently of a front end, and 2) a logger to display what React Agent is doing. These two features can be very helpful in development. 

### Example
```javascript
const server = http.createServer(fn).listen(3000)

const actions = {
  getMessages: {
    pre: request => request.cookie === '123',
    action: 'SELECT * FROM posts'
    callback: (response) => {
      return response[0].forEach(element => {
        return element.message
      })
    }
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





<a name="pre"></a>
## pre
### Syntax
```javascript
// used with one function
pre: function1

// used with multiple functions
pre: [function1 [, function2, ...] ]
```
*Value*  
A function or array of functions executed before an action. Each function receives one argument:
  * `request` (optional) - An object sent from the client.

### Description
The object passed from the client can be modified in a `pre` function before being passed to an action.

 For only one `pre` function, it receives a value passed from the client as its argument. With an array of `pre` functions, the value returned from each function is used as the argument for the subsequent function. The value returned from last function is then passed to the action. 
 
 If any pre function returns `false`, the action is not executed and an error is returned to the client.

  
### Example
```javascript
// one function
pre: request => request.cookie1 === '123'

// multiple functions
pre: [
  request => {
    if (request.cookie1 === '123') return request
    return false
  },
  request => {
    if (request.cookie2 === '456') {
      request.authentification = true;
      return request;
    }
    return false
  }
]
```

<a name="action"></a>
## action
### Syntax
```javascript
// SQL query
action: 'SQL query string'

// function
action: function
```
*Values*    
A raw SQL query string.
  * Values from the request object passed from `pre` or the client can be injected into the SQL query with a colon prefix. For example `:prop`, where `prop` represents a property on the passed request object. Multiple SQL queries can be used in one action by separating them with a semicolon.    

*or*

A function to execute, receiving three arguments:
  * `resolve` - Returns its value to the client.
  * `reject` - The client will catch an error. 
  * `request` (optional) - The object that the client has passed to the action, or the object returned from the final `pre` function.
### Description
`action` is a required property on a key. It can be a SQL query, or a function which resolves or rejects. 
### Example
```javascript
// SQL query action
action: 'INSERT INTO students(name) VALUE(:name); SELECT * from students'

// function action
action: (resolve, reject, request) => {
  const url = request.url
  fetch(url, (error, response, body) => {
    if (error) reject(error)
    else resolve(body)
  })
}
```

<a name="callback"></a>
## callback
### Syntax
```javascript
callback: function
```
*Value*  
A function to execute after the action completes, receiving one argument:
  * `response` - The returned value from the action.
### Description
`callback` is an optional property on a key. The callback's returned value is sent to the client. If `callback` is not provided, the response of the `action` will be sent directly to the client. 

As a best practice, a `callback` is included if the preceding action is a SQL query. 

A `callback` cannot be included if the preceding action is a function (not a SQL query).

When using `callback`, it can be useful to console log  `response` to inspect what the SQL query `action` returns. 
### Example
```javascript
callback: response => { 
  return response[0].map(element => {
    return { name: element.name, id: element.id }
  })
}
```

<a name="errorMessage"></a>
## errorMessage
### Syntax
```javascript
errorMessage: 'string text'
```
*Value*  
An error message string.
### Description
`errorMessage` is an optional property on a key. If an error message is not included, React Agent uses its default error messages. 
### Example
```javascript
errorMessage: 'Error with the getStudents action.'
```
