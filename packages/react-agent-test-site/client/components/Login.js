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
    query('login', data => {
      if (data.error) {
        console.log(JSON.stringify(data.error));
        alert('There was a problem with the database.');
      } else {
        if (data.length === 0) {
          alert('incorrect login');
        } else {
          set('username', data.username);
          set('id', data.id);
        }
      }
    }, [this.state.user, this.state.password]);
  }

  handleRegister() {
    query('register', data => {
      if (data.error) {
        console.log(data.error);
      } else {
        set('username', data.username);
        set('id', data.id);
      }
    }, [this.state.user, this.state.password, this.state.user, this.state.password]);
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
