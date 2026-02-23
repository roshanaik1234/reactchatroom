import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Message from './Message';
import './Chat.css';

let socket;

function Chat({ username, room }) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const [users, setUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Get server URL from environment or use default
  const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

  useEffect(() => {
    // Connect to socket server
    socket = io(SERVER_URL);

    // Join room
    socket.emit('join_room', { username, room });

    // Listen for messages
    socket.on('receive_message', (data) => {
      setMessageList((list) => [...list, data]);
    });

    // Listen for user list updates
    socket.on('room_users', (userList) => {
      setUsers(userList);
    });

    // Listen for typing indicator
    socket.on('user_typing', ({ username: typingUser, isTyping: typing }) => {
      setTypingUsers((prev) => {
        if (typing && !prev.includes(typingUser)) {
          return [...prev, typingUser];
        } else if (!typing) {
          return prev.filter((user) => user !== typingUser);
        }
        return prev;
      });
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [username, room]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageList]);

  const handleTyping = (e) => {
    setCurrentMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { room, username, isTyping: true });
    }

    // Clear typing indicator after stopping
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { room, username, isTyping: false });
    }, 1000);
  };

  const sendMessage = async () => {
    if (currentMessage.trim() !== '') {
      const messageData = {
        room,
        author: username,
        message: currentMessage,
      };

      await socket.emit('send_message', messageData);
      setCurrentMessage('');
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing', { room, username, isTyping: false });
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h3>Room: {room}</h3>
        </div>
        <div className="users-section">
          <h4>Online Users ({users.length})</h4>
          <ul className="users-list">
            {users.map((user) => (
              <li key={user.id} className={user.username === username ? 'current-user' : ''}>
                <span className="user-status"></span>
                {user.username} {user.username === username && '(You)'}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <h3>Chat Room: {room}</h3>
        </div>

        <div className="chat-body">
          {messageList.map((message, index) => (
            <Message
              key={index}
              message={message}
              isOwnMessage={message.author === username}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        <div className="chat-footer">
          <input
            type="text"
            value={currentMessage}
            placeholder="Type a message..."
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            className="message-input"
          />
          <button onClick={sendMessage} className="send-button">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
