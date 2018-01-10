import React, { Component } from 'react';
import { get, query, set } from '../../../react-agent';

class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: ''
    };
  }

  componentDidMount() {
    query('getMessages', data => {
      set('messages', data.data, false);
    });
  }

  handleText(event) {
    this.setState({ text: event.target.value });
  }

  handleSend() {
    if (get('id')) {
      set('messages', [this.state.text, get('id')], true, previous => {
        return [...previous, { chatmessage: this.state.text, date: Date.now(), username: get('username') }];
      });
    } else {
      alert('You must be logged in to comment.');
    }
  }

  handleMessages(messages) {
    return messages.map((message, i) => {
      return (
        <div key={i}>
          {message.chatmessage}<br />
          <em>{message.date}</em><br />
          <strong>{message.username}</strong><br /><br />
        </div>
      );
    });
  }

  render() {
    const messages = get('messages');
    return (
      <div id='chat'>
        <div id='message-box'>
          {messages ? this.handleMessages(messages) : 'no messages'}
        </div>
        <textarea value={this.state.text} onChange={this.handleText.bind(this)} type='text'></textarea>
        <button onClick={this.handleSend.bind(this)}>Send</button>
      </div>
    );
  }
}

export default Chat;
