# React Agent

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
![previous](https://github.com/yokyak/react-agent/raw/master/docs/imgs/diagram-before.gif)

In contrast, React Agent serves as a communication channel between the client and the server. It abstracts state transfer to make it super easy to interact between the client and server.
![now](https://github.com/yokyak/react-agent/raw/master/docs/imgs/diagram-after.gif)


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


## Contributors

### Contributing

Please submit issues/pull requests if you have feedback or message the React Agent team to be added as a contributor: reactagent@gmail.com

### Authors

* **Tom Rosenblatt** - [https://github.com/tskittles](https://github.com/tskittles)

* **Eric Choi** - [https://github.com/eric2turbo](https://github.com/eric2turbo)

* **Henry Au** - [https://github.com/hhau01](https://github.com/hhau01)

* **Andrew Harris** - [https://github.com/didrio](https://github.com/didrio)

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details
