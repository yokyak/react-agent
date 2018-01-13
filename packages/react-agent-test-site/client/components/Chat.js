import React, { Component } from 'react';
import { get, query, set } from '../../../react-agent';

class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: ''
    };
  }

  async componentDidMount() {
    const data = await query('getMessages', null, { cookie: '3098ur03u3ff' });
    set('messages', data.data);
    this.scrollToBottom();
    query('getPlanet', 'https://swapi.co/api/planets/5/', data => {
      console.log(data);
    });
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  handleText(event) {
    this.setState({ text: event.target.value });
  }

  handleSend() {
    if (get('id')) {
      set('messages',
        [...get('messages'), { chatmessage: this.state.text, date: Date.now(), username: get('username') }],
        { message: this.state.text, id: get('id'), cookie: '123' }
      );
      this.setState({ text: '' })
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

  scrollToBottom() {
    this.messagesEnd.scrollIntoView({ behavior: 'instant' });
  }

  render() {
    const messages = get('messages');
    return (
      <div id='chat'>
        <div id='message-box'>
          {messages ? this.handleMessages(messages) : 'no messages'}
          <div style={{ float: 'left', clear: 'both' }}
            ref={(el) => { this.messagesEnd = el; }}>
          </div>
        </div>
        <div id='text-area'>
          <textarea value={this.state.text} onChange={this.handleText.bind(this)} type='text'></textarea>
          <button onClick={this.handleSend.bind(this)}>Send</button>
        </div>
      </div>
    );
  }
}

export default Chat;
