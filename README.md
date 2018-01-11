# React Agent

React Agent synchronizes client-side state and server-side data.  It can be included in any React project without conflict with other state management tools or REST APIs.

With React Agent’s library, a data-mutation on the client-side also updates the server’s database. And on the server-side, database mutations also update the state of subscribed clients. React Agent can also be used as solely a client-side store for state.

It features offline-support to render optimistic updates and then synchronization on reestablished network connection.

*Why use React Agent?*

The popular conceptualization of state management stores state in two places: data on the client-side and data on the server-side. To connect these, front-end and back-end developers usually write a lot of code such as HTTP requests, controllers, and routes. It can get complicated.

## Getting Started

Install the package:

```bash
npm install react-agent --save
```

See [React Agent](https://github.com/yokyak/react-agent/tree/master/packages/react-agent) for information about client-side set-up.



Install the package:

```bash
npm install react-agent-server --save
```

See [React Agent Server](https://github.com/yokyak/react-agent/tree/master/packages/react-agent-server) for information about server-side set-up.

