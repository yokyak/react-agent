#React-Agent

React-agent synchronizes client-side state and server-side data.  It can be included in any React project without conflict with other state management tools or REST APIs.

With react-agent’s library, a data-mutation on the client-side also updates the server’s database. And on the server-side, database mutations also update the state of subscribed clients. React-agent can also be used as solely a client-side store for state.

It features offline-support to render optimistic updates and then synchronization on reestablished network connection.

*Why use React-agent?*
The popular conceptualization of state management stores state in two places: data on the client-side and data on the server-side. To connect these, front-end and back-end developers usually write a lot of code such as HTTP requests, controllers, and routes. It can get complicated.

##Getting Started

This guide is focused on client-side usage of react-agent, although it includes necessary details to know about server-side usage. See [react-agent-server](https://github.com/yokyak/react-agent/tree/master/packages/react-agent-server) for more information about server-side set-up.



#Installing
Install the package:
```javascript
npm install react-agent
```

#How to use
First, import react-agent into your highest level React component.
```javascript
import { Agent } from 'react-agent';
```

Then, wrap your main component in <Agent> </Agent> to start react-agent running when your app loads.

```javascript
render(
 <Agent>
   <App />
 </Agent>
 , document.querySelector('#root'));
 ```

Optionally, you can set set an initial state for react-agent with store={initialStore}.  As we’ll see, the state set with react-agent is accessible from any component.

```javascript
const initialStore = {
 first: true,
 second: false,
 third: 'ok'
};
render(
 <Agent store={initialStore}>
   <App />
 </Agent>
 , document.querySelector('#root'));
```

Let’s get started on the fun part. Import react-agent into a React component.

```javascript
import { get, set, query } from 'react-agent';
```

get, set, and query are used for interacting with client and server-side state.  To start, let’s use set to write to the react-agent store and get to return the values.

The set method takes a key, value pair as its parameters.

```javascript
set(‘username’, ‘Billy’)
```

The get method takes a key and returns the associated value.

```javascript
get(‘username’) // returns ‘Billy’
```

Since react-agent’s methods can be imported into any component, react-agent state is now accessible from any component without ‘passing-down’ props.  Under the hood, react-agent uses React’s virtual DOM for efficient rendering.

If the key ‘username’  does not match a known key on the server-side, this state will only be stored on the client-side. That is, syncing client state with the server’s database is optional. You can also store state on the client-side without updating the server-side by including a third parameter false in the set method. This third argument is true by default, so that client-side and server-side data are synced.

```javascript
 set(‘username’, ‘Billy’, false)
```

Let’s assume that the ‘username’  key on the client-side also exists on the server-side, so that synchronization occurs. This server-side ‘username’ key represents a database query.
When ‘Billy’ is passed as the second parameter in set, it is included in that database query. We can also pass multiple values in the form of an array, and these values are passed to the database query in the given order of the array.

```javascript
 set(‘username’, [‘Billy’, ‘32’, ‘Los Angeles’])
 ```

set takes an optional callback function as the fourth parameter. Rather than modifying react-agent state with key-value pairs, it allows for more nuanced control the state. The callback is used similarly to React’s [setState function](https://reactjs.org/docs/react-component.html#setstate).  However, whereas React’s setState accepts previous state as an argument, react-agent’s callback accepts an argument (i.e. prevValue) that represents the previous value of the specified key. The returned value of the callback should be the new value of the key.

```javascript
 set(‘username’, [‘Billy’, ‘32’, ‘Los Angeles’], true, prevValue => {
    return [...prevValue, { username: ‘Billy’, age: 32, city: ‘Los Angeles’ }];
 });
 ```

In addition to set and  get, react-agent includes the function query, which interacts with the server’s database.  query is similar to set  in that it takes matching keys and associated values as arguments but differs in functionality in two ways: 1) a typical query expects a response from the server, and includes a callback function to handle the server’s response.  2) query does not change the client state, so it must be used in conjunction with  set to update react-agent’s state.

```javascript
query('register',  [this.state.user, this.state.password], data => {
     if (data.error) {
       console.log(data.error);
     } else {
       set('userID', data.userID);
     }
});
```

Above, the query with the key 'register' is running on the server side with the given values this.state.user  and this.state.password.  In the callback, set is invoked with the value data.userID from the server response to save userID to react-agent state.

_Note: the second parameter of values is an optional argument. If you do not include values, simply include the callback as the second parameter._

_Note: while react-agent can be used a store for state, it can also be used without conflict alongside other state management tools such as Redux or React component state._
