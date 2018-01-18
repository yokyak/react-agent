import React, { Component } from 'react';
import { render } from 'react-dom';
import Chat from './components/Chat';
import Login from './components/Login';
import { Agent } from '../../react-agent';
import './style.css';

class App extends Component {

  render() {
    return (
      <div id="app">
        <Login />
        <Chat />
      </div>
    );
  }
}

const initialStore = {
  first: true,
  second: false,
  third: 'ok',
};

render(
  <Agent store={initialStore} logger={false} devTools={true}>
    <App />
  </Agent>
  , document.querySelector('#root')
);
