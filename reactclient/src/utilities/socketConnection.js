import io from 'socket.io-client';
let socket = io.connect('http://127.0.0.1:8181');

console.log(socket);
// Anybody who imports this file will get socket object
export {
    socket,
    io
}
