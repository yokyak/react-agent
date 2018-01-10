import React, {Component} from 'react';
import { render } from 'react-dom';
import Chat from './components/Chat';
import Login from './components/Login';
import { Agent } from '../../react-agent';
import './style.css';

class App extends Component {
  render() {
    return(
      <div>
        <Login />
        <Chat />
      </div>
    );
  }
}

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
