import React from 'react';
import './Message.css';

function Message({ message, isOwnMessage }) {
  const isSystem = message.author === 'System';
  
  return (
    <div className={`message ${isOwnMessage ? 'own' : ''} ${isSystem ? 'system' : ''}`}>
      <div className="message-content">
        {!isSystem && !isOwnMessage && (
          <span className="message-author">{message.author}</span>
        )}
        <p className="message-text">{message.message}</p>
        <span className="message-time">{message.time}</span>
      </div>
    </div>
  );
}

export default Message;
