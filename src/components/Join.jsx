import React, { useState } from 'react';
import './Join.css';

function Join({ onJoin }) {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && room.trim()) {
      onJoin(username, room);
    }
  };

  return (
    <div className="join-container">
      <div className="join-card">
        <h1>Join Chat</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="join-input"
            required
          />
          <input
            type="text"
            placeholder="Enter room name"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="join-input"
            required
          />
          <button type="submit" className="join-button">
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}

export default Join;
