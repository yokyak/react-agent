# Client-side Documentation for React Agent

## Agent
### Syntax
```javascript
render(
  <Agent>
    <App />
  </Agent>
  , document.querySelector(#root))
```
*Parameters*  
`<Agent>` takes four *optional* arguments:  
  * `devTools = { true }` - enables Redux Chrome Dev Tools
  * `store= { initialStore }` - set React Agent's store with initial values by providing an object, `initialStore`
  * `logger= { true }` - console logs what React Agent is doing on the client-side
  * `offlinePopUp = { true }` - warns a user if they try to navigate away from the page with unexecuted server-side changes (i.e. in case of poor network connection)
### Description
The `<Agent>` wrapper is the initial set-up for React Agent. Optionally, it can be configured to enable time travel debugging, a logger, an initial store, and a pop-up for unsaved changes. 
### Example
```javascript

```

## set
### Syntax
```javascript
// arguments can be an object
set({ property: value })
set({ property0: value0, property1: value1, propertyN: valueN })

// arguments can be comma separated values
set(property, value)
set(property0, value0, property1, value1, propertyN, valueN)
```
*Parameters*   
`property` - a string  
`value` -  any value
### Description
Stores an object in React Agent's store, which uses 1) React's diffing algorithm for fast re-rendering, and 2) Redux for time travel debugging. 
### Example
```javascript

```

## get
### Syntax
```javascript
get(property)
```
*Parameters*  
`property` - a string referring to a property `set` in React Agent's store

*Return value*  
The value of the property in React Agent's store.

### Description
The `get` method is used to retrieve a value from React Agent's store. If it is called without an argument, it returns the entire current state of the store. 
### Example
```javascript

```

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

## run
### Syntax
```javascript
\\ running a single action
run(key[, value ])

\\ running multiple actions
run([key0[, key1[, keyN ] ] ] ][, value ])
```
*Parameters*  
`key` - a string that matches an action key defined on the server-side. Multiple `key`s should be included in an array.  
`value` (optional) - a value that is passed to the server-side action. If multiple actions are run, the same value is passed to all of the actions. 
### Description
`run` executes an action or multiple actions on the server-side, and can optionally send a value to that action(s). 
### Example
```javascript

```

## on
### Syntax
```javascript
on(key, callback)
```
*Parameters*  
`key` - a string that matches an action key defined on the server-side. 
`callback` - a function that runs on updates to the action, receiving one argument:
  * `data` - the result of the server-side action
### Description
The `on` method subscribes a client to an action key. That is, if `emit` is called with the corresponding key, the server pushes state updates to all subscribed clients.
### Example
```javascript

```

## emit
### Syntax
```javascript
emit(key[, value])
```
*Parameters*  
`key` - a string that matches an action key defined on the server-side. 
`value` (optional) - a value that is passed to the server-side action.
### Description
The `emit` method pushes an update from the server to any client who has subscribed to a specific action key. 
### Example
```javascript

```

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

## isOfflineCacheEmpty
### Syntax
```javascript
isOfflineCacheEmpty()
```
*Return Value*  
Boolean indicating whether React Agent's cache is empty. 
### Description
The `isOfflineCacheEmpty` method assesses the current state of the cache. The cache is used to store client requests to the server. Once a request is completed on the server, it is deleted from the client cache. 

This method can be useful to determine if the client has requests that need to be sent to the server. For example, if network connection drops and a client continues to use the website, the cache may not be empty; `isOfflineCacheEmpty()` would return `false`. Once the connection returns, the cache would successfully resend any client requests made in the interim; `isOfflineCacheEmpty()` would return `true`. 

Also, consider including the flag `offlinePopUp={true}` in `Agent` for an automatic pop-up if a client tries to navigate away from the site with unsaved progress. This pop-up uses `isOfflineCacheEmpty` under the hood.

### Example
```javascript

```

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

# Server-side Documentation for React Agent Server

## agent
### Syntax
```javascript
agent(server, actions[, database])
```
*Parameters*  
`server` - a Node server.  
`actions` - a nested object where each entry is a key/property, the value of which is an object containing the properties `pre` (optional), `action` (required), `callback` (optional), and `errorMessage` (optional).  
`database` (optional) - an object containing the information necessary to connect to a database. It requires the six properties:
  * `name`
  * `user`
  * `password`
  * `dialect`
  * `host`
  * `port`

### Description
### Example
```javascript

```

## pre
### Syntax
```javascript
// used with multiple functions
pre: [function0[, function1], ...functionN] ] ]

// used with one function
pre: function0
```
*Value*  
`functionN` - a function executed before an action, receiving one argument:
  * `request` - a value sent from the client

### Description
`pre` is executed before an action. `pre` `function0` receives a value passed from the client as it argument. In a `pre` function list, the return value from `functionN` is used as the argument of `functionN+1`. At the end of the list, the return value is passed to the action.  
### Example
```javascript

```

## action
### Syntax
```javascript
// SQL query
action: 'SQL query'

// function
action: callback
```
*Values*  
`'SQL query'` - a raw SQL query string
  * Values from an object passed from `pre` or the client can be injected in the SQL query using the syntax `$prop`, where `prop` represents a property on the passed object.   

`callback` - function to execute, receiving three arguments:
  * `resolves` - returns its value to the client.
  * `rejects` - the client will catch an error. 
  * `body` (optional) - a value that the client has passed to the action, or the value returned from the final `pre` function.
### Description
`action` is a required property on a key. It can be a SQL query, or a function which resolves/rejects. 
### Example
```javascript

```

## callback
### Syntax
```javascript
callback: callbackFunction
```
*Value*  
`callbackFunction` - function to execute after the action completes, receiving one argument:
  * `response` - object returned from the action.
### Description
`callback` is an optional property on a key. The return value from callbackFunction is sent to the client. 
### Example
```javascript

```

## errorMessage
### Syntax
```javascript
errorMessage: 'string text'
```
*Value*  
'string text' - a string.
### Description
`errorMessage` is an optional property on a key. If an error message is not included, React Agent uses its default error messages. 
### Example
```javascript

```
