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
server  
actions  
database (optional)
### Description
### Example
```javascript

```

## pre
### Syntax
```javascript
// used with multiple functions
pre: [function1[, function2], ...functionN] ] ]

// used with one function
pre: function1
```
*Parameters*  
function1, function2, ...functionN


### Description
### Example
```javascript

```

## action
### Syntax
```javascript
// SQL query
action: 'SQL_Query'

// function
action: callback
```
*Parameters*  
callback
  * resolves  
  * rejects  
  * body (optional)
### Description
### Example
```javascript

```

## callback
### Syntax
```javascript

```
*Parameters*  
### Description
### Example
```javascript

```

## errorMessage
### Syntax
```javascript

```
*Parameters*  
### Description
### Example
```javascript

```
