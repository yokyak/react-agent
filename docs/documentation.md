# Documentation

## Index  
### [Client-Side: React Agent](#client)  
  * [Agent](#Agent)   
  * [set](#set)  
  * [get](#get)  
  * [destroy](#destroy)  
  * [run](#run)  
  * [on](#on)  
  * [emit](#emit)  
  * [unsubscribe](#unsubscribe)  
  * [isOfflineCacheEmpty](#isOfflineCacheEmpty)  
  * [getStore](#getStore)  

### [Server-Side: React Agent Server](#server) 
  * [agent](#agent)  
  * [pre](#pre)  
  * [action](#action)  
  * [callback](#callback)  
  * [errorMessage](#errorMessage)  

<a name="client"></a> 
# Client-Side: React Agent

<a name="Agent"></a>
## Agent
### Syntax
```javascript
render(
  <Agent property={value}>
    <App />
  </Agent>
  , document.querySelector(#root))
```
*Parameters*  
`<Agent>` wraps a higher order React component, `<App>`. It receives four *optional* arguments as  `property={value}`:  
  * `devTools = { true }` - enables time travel debugging via Redux Chrome Dev Tools. 
  * `store= { initialStore }` - sets React Agent's store with initial values by providing an object, `initialStore`.
  * `logger= { true }` - console logs what React Agent is doing on the client-side.
  * `offlinePopUp = { true }` - warns a user if they try to navigate away from the page with unexecuted server-side changes (i.e. in case of poor network connection).
### Description
The `<Agent>` wrapper is the initial set-up to make React Agent work throughout your app. Optionally, it can be configured to enable time travel debugging, a logger, an initial store, and a pop-up for unsaved changes. 
### Example
```javascript

```

<a name="set"></a>
## set
### Syntax
```javascript
// arguments can be an object
set({ property0: value0 })
set({ property0: value0[, property1: value1[, propertyN: valueN ] ] })

// arguments can be comma separated values
set(property0, value0)
set(property0, value0[, property1, value1[, ...propertyN, valueN ] ] )
```
*Parameters*   
`property` - a string.   
`value` -  any value.

Only `property0` and `value0` are required arguments. If `value0` is not provided, the value will be null. 
### Description
The `set` method stores an object in React Agent's store, which uses 1) React's diffing algorithm for fast re-rendering, and 2) Redux for time travel debugging. 
### Example
```javascript

```

<a name="get"></a>
## get
### Syntax
```javascript
get(property)
```
*Parameters*  
`property` - a string referring to a property `set` in React Agent's store

*Return value*  
The value of the `property` in React Agent's store.

### Description
The `get` method is used to retrieve a value from React Agent's store. If it is called without an argument, it returns the entire current state of the store. 
### Example
```javascript

```

<a name="destroy"></a>
## destroy
### Syntax
```javascript
destroy(property)
```
*Parameters*  
`property` - a string referring to a property `set` in React Agent's store
### Description
Deletes a property and its value from React Agent's store. 
### Example
```javascript

```

<a name="run"></a>
## run
### Syntax
```javascript
\\ running a single action
run(key0[, value0 ])

\\ running multiple actions
run([key0[, key1[, keyN ] ] ][, value ])
```
*Parameters*  
`key` - a string that matches an action key defined on the server-side. Multiple `key`s are listed in an array.  
`value` (optional) - a value that is passed to the server-side action(s). If multiple actions are run, the same value is passed to all of the actions. 

*Return Value*  
A promise, which resolves or rejects based on the server's response.  
### Description
`run` executes an action or multiple actions on the server-side, and can optionally send a value to those action(s). 
### Example
```javascript

```

<a name="on"></a>
## on
### Syntax
```javascript
on(key, callback)
```
*Parameters*  
`key` - a string that matches an action key defined on the server-side. 
`callback` - a function that runs when an action is `emit` by any client, receiving one argument:
  * `data` - the result of the server-side action.
### Description
The `on` method subscribes a client to an action key. That is, if `emit` is called with the corresponding action key, the server pushes state updates to all subscribed clients.
### Example
```javascript

```
<a name="emit"></a>
## emit
### Syntax
```javascript
emit(key[, value])
```
*Parameters*  
`key` - a string that matches an action key defined on the server-side. 
`value` (optional) - a value that is passed to the server-side action.
### Description
The `emit` method pushes an update from the server to any client who has subscribed to the corresponding action key. 
### Example
```javascript

```

<a name="unsubscribe"></a>
## unsubscribe
### Syntax
```javascript
unsubscribe(key)
```
*Parameters*  
`key` - a string that matches an action key defined on the server-side. 
### Description
The `unsubscribe` method unsubscribes a client from emitted updates for an action key.
### Example
```javascript

```

<a name="isOfflineCacheEmpty"></a>
## isOfflineCacheEmpty
### Syntax
```javascript
isOfflineCacheEmpty()
```
*Return Value*  
Boolean indicating whether React Agent's cache is empty. 
### Description
The `isOfflineCacheEmpty` method assesses the current state of the client cache. The cache is used to store client requests to the server. Once a request is completed on the server, it is deleted from the client cache. 

This method can be useful to determine if the client has unsaved changes; that is, requests that need to be sent to the server. For example, if network connection is offline and a user continues to interact with the website via optimistic updates, the cache may not be empty; `isOfflineCacheEmpty()` may return `false`. Once the network connection returns, the cache would successfully resend any client requests made in the interim; `isOfflineCacheEmpty()` would return `true`. 

Also, consider including the flag `offlinePopUp={true}` in `<Agent>` for an automatic pop-up if a user tries to navigate away from the site with unsaved progress. This pop-up uses `isOfflineCacheEmpty` under the hood.

### Example
```javascript

```

<a name="getStore"></a>
## getStore
### Syntax
```javascript
getStore() 
```
*Return Value*  
The current state of React Agent's store. 
### Description
Alternatively, use `get()` for the same result.
### Example
```javascript

```
<a name="server"></a> 
# Server-Side: React Agent Server

<a name="agent"></a>
## agent
### Syntax
```javascript
agent(server, actions[, database])
```
*Parameters*  
`server` - a Node server.  
`actions` - a nested object where each entry is a key indicating the name of the action, and a value of an object containing the properties `pre` (optional), `action` (required), `callback` (optional), and `errorMessage` (optional).  
`database` (optional) - an object containing the information necessary to connect to a database. It requires the six properties:
  * `name`
  * `user`
  * `password`
  * `dialect`
  * `host`
  * `port`

### Description
The `agent` method is the intitial set-up to get React Agent Server working on the server-side.
### Example
```javascript

```

<a name="pre"></a>
## pre
### Syntax
```javascript
// used with one function
pre: function0

// used with multiple functions
pre: [function0[, function1], ...functionN] ] ]
```
*Value*  
`functionN` - a function executed before an action, receiving one argument:
  * `request` (optional) - a value sent from the client

### Description
The object passed from the client can be modified in a pre function(s) before being passed to an action.

 For only one `pre` function, `function0` receives a value passed from the client as it argument. In a `pre` function list, the return value from `functionN` is used as the argument of `functionN+1`. At the end of the list, the return value is passed to the action.
 
 If a pre function returns `false`, the action is not executed and an error is returned to the client.

  
### Example
```javascript

```

<a name="action"></a>
## action
### Syntax
```javascript
// SQL query
action: 'SQL query'

// function
action: function
```
*Values*  
`'SQL query'` - a raw SQL query string
  * Values from an object passed from `pre` or the client can be injected in the SQL query using the syntax `:prop`, where `prop` represents a property on the passed object. Multiple SQL queries can be used in one action by separating them with a semicolon `;`,   

`function` - function to execute, receiving three arguments:
  * `resolves` - returns its value to the client.
  * `rejects` - the client will catch an error. 
  * `body` (optional) - a value that the client has passed to the action, or the value returned from the final `pre` function.
### Description
`action` is a required property on a key. It can be a SQL query, or a function which resolves and rejects. 
### Example
```javascript

```

<a name="callback"></a>
## callback
### Syntax
```javascript
callback: callbackFunction
```
*Value*  
`callbackFunction` - function to execute after the action completes, receiving one argument:
  * `response` - object returned from the action.
### Description
`callback` is an optional property on a key. The return value from callbackFunction is sent to the client. If `callback` is not provided, the response of the `action` will be sent directly to the client. 

As a best practice, a `callback` is included if the preceding action is a SQL query. 

A `callback` cannot be included if the preceding action is a function (not a SQL query).

When using `callback`, it can be useful to console log  `response` to parse what the SQL query `action` returns. 
### Example
```javascript

```

<a name="errorMessage"></a>
## errorMessage
### Syntax
```javascript
errorMessage: 'string text'
```
*Value*  
`string text` - a string.
### Description
`errorMessage` is an optional property on a key. If an error message is not included, React Agent uses its default error messages. 
### Example
```javascript

```
