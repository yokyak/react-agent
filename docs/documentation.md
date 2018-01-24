# Client-side Documentation for React Agent

## Agent
### Syntax
```javascript

```
*Parameters*  
### Description
### Example
```javascript

```

## set
### Syntax
```javascript

```
*Parameters*  
### Description
### Example
```javascript

```

## get
### Syntax
```javascript

```
*Parameters*  
### Description
### Example
```javascript

```

## destroy
### Syntax
```javascript

```
*Parameters*  
### Description
### Example
```javascript

```

## run
### Syntax
```javascript

```
*Parameters*  
### Description
### Example
```javascript

```

## on
### Syntax
```javascript

```
*Parameters*  
### Description
### Example
```javascript

```

## emit
### Syntax
```javascript

```
*Parameters*  
### Description
### Example
```javascript

```

## unsubscribe
### Syntax
```javascript

```
*Parameters*  
### Description
### Example
```javascript

```

## isOfflineCacheEmpty
### Syntax
```javascript

```
*Parameters*  
### Description
### Example
```javascript

```

## getStore
### Syntax
```javascript

```
*Parameters*  
### Description
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
