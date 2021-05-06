const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatBot';
// Run when a client connects
io.on('connection', socket => {
    console.log('new websocket connection');
    socket.on('joinRoom', ({ username, room}) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);
        socket.emit('message', formatMessage(botName, 'Welcome to ChatCord'));

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message' , formatMessage(botName, `${user.username} has joined the chat`));

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    });
    
     // Listen for chat message
   socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        console.log('chatMessage');
        console.log(user);
        console.log(msg);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
 });

    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        console.log('disconnect');
        console.log(user);
        if(user) {
        io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
        }
    });

});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));