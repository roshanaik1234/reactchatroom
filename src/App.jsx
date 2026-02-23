import React, { useState } from 'react';
import Join from './components/Join';
import Chat from './components/Chat';
import './App.css';

function App() {
  const [isJoined, setIsJoined] = useState(false);
  const [user, setUser] = useState({ username: '', room: '' });

  const handleJoin = (username, room) => {
    setUser({ username, room });
    setIsJoined(true);
  };

  return (
    <div className="App">
      {isJoined ? (
        <Chat username={user.username} room={user.room}  setIsJoined={setIsJoined}/>
      ) : (
        <Join onJoin={handleJoin} />
      )}
    </div>
  );
}

export default App
