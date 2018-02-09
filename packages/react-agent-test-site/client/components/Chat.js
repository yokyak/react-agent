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
    run(['getUsers', 'getIds'], { cookie: '987' }).then(data => console.log('TWO RUNS: ', data));
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

  // it would make more sense to have a more powerful getGIF action that also 
  // posted to the database. Then, it would be unneccessary to also invoke the 
  // postMessage action. However, for the sake of demonstrating how to use 
  // resolve and reject on the server-side, we are running both getGIF and 
  // postMessage. 
  sendGIF(){
    if (get('id')) {
      const newMessage = { chatmessage: this.state.text, date: Date.now(), username: get('username') };
      const oldMessages = get('messages');
      set('messages', [...oldMessages, newMessage]);
      run('getGIF', this.state.text)
      .then(data => 
        run('postMessage', { message: data, id: get('id') })
        .then(success => { emit('getMessages') })
        .catch(error => { set('messages', oldMessages) })
      )
      .catch(error => { set('messages', oldMessages) });
      this.setState({ text: '' });
    } else {
      alert('You must be logged in to comment.');
    }
  }
  
  handleMessages(messages) {
    return messages.map((message, i) => {
      const gif = message.chatmessage.match(/https:\/\/media[0-9]\.giphy\.com\/media\//);
      return (
        <div key={i}>
          { gif ? <img src={message.chatmessage}></img> : message.chatmessage }<br />
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
          <button id='gif' onClick={this.sendGIF.bind(this)}>gif</button>
        </div>
        <button id='destroy' onClick={this.clearMessages.bind(this)}>Destroy</button>
      </div>
    );
  }
}

export default Chat;
