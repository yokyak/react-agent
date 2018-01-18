import React, { Component } from 'react';
import { get, set, run, on, emit, destroy } from '../../../react-agent';

class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: ''
    };
  }

  componentDidMount() {
    run('getMessages')
      .then(data => {
        set('messages', data.messages);
        this.scrollToBottom();
        this.getPlanets();
      })
      .catch(error => { alert(error) });
    on('getMessages', data => set('messages', data.messages));
    const { first, second, third } = get('first', 'second', 'third');
    run(['getUsers', 'getIds']).then(data => console.log('TWO RUNS: ', data));
  }

  componentDidUpdate() { this.scrollToBottom() }

  handleText(event) { this.setState({ text: event.target.value }) }

  scrollToBottom() { this.messagesEnd.scrollIntoView({ behavior: 'instant' }) }

  getPlanets() {
    run('getPlanet', { url: 'https://swapi.co/api/planets/5/' })
      .then(data => { console.log(data) })
      .catch(error => { alert(error) });
  }

  handleSend() {
    if (get('id')) {
      const newMessage = { chatmessage: this.state.text, date: Date.now(), username: get('username') };
      const oldMessages = get('messages');
      set('messages', [...oldMessages, newMessage]);
      run('postMessage', { message: this.state.text, id: get('id') })
        .then(data => { emit('getMessages') })
        .catch(error => { set('messages', oldMessages) });
      this.setState({ text: '' });
    } else {
      alert('You must be logged in to comment.');
    }
  }

  handleMessages(messages) {
    return messages.map((message, i) => {
      return (
        <div key={i}>
          { message.chatmessage }<br />
          <em>{ message.date }</em><br />
          <strong>{ message.username }</strong><br /><br />
        </div>
      );
    });
  }

  clearMessages() {
    destroy('messages');
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
          <button id='submit' onClick={this.handleSend.bind(this)}>Send</button>
        </div>
        <button id='destroy' onClick={this.clearMessages.bind(this)}>Destroy</button>
      </div>
    );
  }
}

export default Chat;
