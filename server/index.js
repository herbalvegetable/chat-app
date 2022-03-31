const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 5000;

server.listen(port, ()=>{
    console.log(`Server listening to port ${port}`);
});

io.on('connection', socket=>{
    console.log(`Client connected: ${socket.id}`);
    socket.emit('initClient', {
        msgList: Message.list,
    });
    socket.on('sendMessage', msg=>{
        console.log(`Server: ${msg.text}`);
        io.emit('sendMessage', msg);
    });
    socket.on('updateMessageList', data=>{
        console.log(data.msg.id);
        Message.list.push(data.msg);
    });
    socket.on('disconnect', ()=>{
        console.log(`Client disconnected: ${socket.id}`);
    });
});

class Message{
    static list = [];
}