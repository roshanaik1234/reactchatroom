const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store users in rooms
const rooms = {};

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('join_room', ({ username, room }) => {
    socket.join(room);
    
    // Initialize room if not exists
    if (!rooms[room]) {
      rooms[room] = { users: [], messages: [] };
    }
    
    // Add user to room
    const user = { id: socket.id, username };
    rooms[room].users.push(user);
    
    // Welcome message
    socket.emit('receive_message', {
      room,
      author: 'System',
      message: `Welcome ${username} to room ${room}!`,
      time: new Date().toLocaleTimeString()
    });
    
    // Notify others
    socket.to(room).emit('receive_message', {
      room,
      author: 'System',
      message: `${username} has joined the chat`,
      time: new Date().toLocaleTimeString()
    });
    
    // Send updated user list
    io.to(room).emit('room_users', rooms[room].users);
    
    console.log(`${username} joined room: ${room}`);
  });

  socket.on('send_message', (data) => {
    const { room, author, message } = data;
    const time = new Date().toLocaleTimeString();
    
    // Store message
    if (rooms[room]) {
      rooms[room].messages.push({ author, message, time });
    }
    
    // Broadcast to everyone in room including sender
    io.to(room).emit('receive_message', { room, author, message, time });
  });

  socket.on('typing', ({ room, username, isTyping }) => {
    socket.to(room).emit('user_typing', { username, isTyping });
  });

  socket.on('disconnect', () => {
    // Find and remove user from all rooms
    for (const roomName in rooms) {
      const room = rooms[roomName];
      const userIndex = room.users.findIndex(u => u.id === socket.id);
      
      if (userIndex !== -1) {
        const [removedUser] = room.users.splice(userIndex, 1);
        
        // Notify others in room
        socket.to(roomName).emit('receive_message', {
          room: roomName,
          author: 'System',
          message: `${removedUser.username} has left the chat`,
          time: new Date().toLocaleTimeString()
        });
        
        // Send updated user list
        io.to(roomName).emit('room_users', room.users);
        
        // Clean up empty rooms
        if (room.users.length === 0) {
          delete rooms[roomName];
        }
        
        console.log(`User Disconnected: ${removedUser.username}`);
        break;
      }
    }
  });
});

// Listen on all network interfaces
server.listen(3001, '0.0.0.0', () => {
  console.log('SERVER RUNNING ON PORT 3001');
});
