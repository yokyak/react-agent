import React, { Component } from 'react';
import { get, set, run } from '../../../react-agent';

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: '',
      password: ''
    };
  }

  handleUser(event) { this.setState({ user: event.target.value }) }

  handlePassword(event) { this.setState({ password: event.target.value }) }

  handleLogin() {
    run('login', { username: this.state.user, password: this.state.password, cookie1: '123', cookie2: '456' })
      .then(data => { set('username', data.username, 'id', data.id) })
      .catch(error => { alert(error) });
  }

  handleRegister() {
    run('register', { username: this.state.user, password: this.state.password })
      .then(data => { set('username', data.username, 'id', data.id) })
      .catch(error => { alert(error) });
  }

  render() {
    if (get('username')) {
      return (
        <div id='login'>
          You are logged in as......<strong>{get('username')}</strong>
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
