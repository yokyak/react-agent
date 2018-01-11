import React, { Component } from 'react';
import { set, get, query } from '../../../react-agent';

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: '',
      password: ''
    };
  }

  handleUser(event) {
    this.setState({ user: event.target.value });
  }

  handlePassword(event) {
    this.setState({ password: event.target.value });
  }

  handleLogin() {
    query('login', [this.state.user, this.state.password], data => {
      if (data.validationError) {
        alert(JSON.stringify(data.validationError));
      } else if (data.databaseError) {
        alert(JSON.stringify(data.databaseError));
      } else {
        if (data.length === 0) {
          alert('incorrect login');
        } else {
          set('username', data.username);
          set('id', data.id);
        }
      }
    }, {val1: true, val2: true});
  }

  handleRegister() {
    query('register', [this.state.user, this.state.password, this.state.user, this.state.password], data => {
      if (data.error) {
        console.log(data.error);
      } else {
        set('username', data.username);
        set('id', data.id);
      }
    });
  }

  render() {
    if (get('username')) {
      return (
        <div>
          You are logged in as: <strong>{get('username')}</strong>
        </div>
      );
    } else {
      return (
        <div id='login'>
          <input value={this.state.user} onChange={this.handleUser.bind(this)} type='text' />
          <input value={this.state.password} onChange={this.handlePassword.bind(this)} type='password' />
          <button onClick={this.handleLogin.bind(this)}>Login</button>
          <button onClick={this.handleRegister.bind(this)}>Register</button>
        </div>
      );
    }
  }
}

export default Login;
