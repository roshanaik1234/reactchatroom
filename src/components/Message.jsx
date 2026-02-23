import React, { useState } from 'react';
import './Message.css';

const reactionEmojis = ['😀', '😂', '😍', '👍', '👎', '❤️', '🎉', '🔥'];

function Message({ message, isOwnMessage, reactions = [], onReaction }) {
  const isSystem = message.author === 'System';
  const [showReactions, setShowReactions] = useState(false);

  const handleReactionClick = (emoji) => {
    if (onReaction) {
      onReaction(emoji);
    }
    setShowReactions(false);
  };

  return (
    <div 
      className={`message ${isOwnMessage ? 'own' : ''} ${isSystem ? 'system' : ''}`}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      <div className="message-content">
        {!isSystem && !isOwnMessage && (
          <span className="message-author">{message.author}</span>
        )}
        <p className="message-text">{message.message}</p>
        <span className="message-time">{message.time}</span>
        
        {/* Show reactions */}
        {reactions.length > 0 && (
          <div className="message-reactions">
            {reactions.map((reaction, index) => (
              <span key={index} className="reaction-badge" title={reaction.users.join(', ')}>
                {reaction.emoji} {reaction.users.length > 1 && reaction.users.length}
              </span>
            ))}
          </div>
        )}

        {/* Reaction picker */}
        {showReactions && !isSystem && (
          <div className="reaction-picker">
            {reactionEmojis.map((emoji, index) => (
              <button 
                key={index} 
                className="reaction-button"
                onClick={() => handleReactionClick(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Message;
