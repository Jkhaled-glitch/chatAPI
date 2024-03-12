

let onlinesUsers = [];

function handleConnection(socket,io) {
  
  socket.on('addNewUser', (newUser) => {
    if (!onlinesUsers.some(user => user._id === newUser._id)) {
      onlinesUsers.push({
        user:newUser,
        socketId: socket.id
      });
    }
    io.emit('getOnlinesUsers', onlinesUsers);
  });
/*
  socket.on('message', (message) => {
    console.log('message from socket')

    const user = onlinesUsers.find((user) => user.userId === message.participant);
    if (user) {
      socket.to(user.socketId).emit('getMessage', message);
    } else {
      console.log('User not found:', message.participant);
    }
  });
  */

  socket.on('disconnect', () => {
    onlinesUsers = onlinesUsers.filter(user => user.socketId !== socket.id);
    io.emit('getOnlinesUsers', onlinesUsers);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
}


module.exports = { handleConnection };
