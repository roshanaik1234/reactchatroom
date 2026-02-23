import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import Message from './Message';
import { TbLogout2 } from "react-icons/tb";
import './Chat.css';

let socket;

function Chat({ username, room, setIsJoined }) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const [users, setUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messageReactions, setMessageReactions] = useState({});
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

    // Listen for reactions
    socket.on('message_reaction', ({ messageIndex, emoji, reactor }) => {
      setMessageReactions((prev) => {
        const key = `${room}-${messageIndex}`;
        const current = prev[key] || [];
        const existing = current.find(r => r.emoji === emoji);
        
        if (existing) {
          if (!existing.users.includes(reactor)) {
            existing.users.push(reactor);
          }
        } else {
          current.push({ emoji, users: [reactor] });
        }
        
        return { ...prev, [key]: [...current] };
      });
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [username, room, SERVER_URL, room]);

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

  const onEmojiClick = (emojiObject) => {
    setCurrentMessage((prev) => prev + emojiObject.emoji);
  };

  const addReaction = (messageIndex, emoji) => {
    socket.emit('message_reaction', { 
      room, 
      messageIndex, 
      emoji, 
      reactor: username 
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showEmojiPicker]);

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h3><TbLogout2 
          color="red" onClick={()=>{
           setIsJoined(false);
            socket.disconnect();
          }}/>  Room: {room}</h3>
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
              reactions={messageReactions[`${room}-${index}`] || []}
              onReaction={(emoji) => addReaction(index, emoji)}
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
          <div className="emoji-picker-container">
            <button 
              className="emoji-button" 
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPicker(!showEmojiPicker);
              }}
            >
              😊
            </button>
            {showEmojiPicker && (
              <div className="emoji-picker-wrapper" onClick={(e) => e.stopPropagation()}>
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  width={300}
                  height={400}
                  previewEmoji="😊"
                  skinTonesDisabled
                />
              </div>
            )}
          </div>
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
