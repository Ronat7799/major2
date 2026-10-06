const http = require('http');
const { Server } = require('socket.io');
const env = require('./config/env');
const app = require('./app');
const initChatSocket = require('./sockets/chatSocket');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.frontendUrl,
    credentials: true,
  },
});

initChatSocket(io);

server.listen(env.port, () => {
  console.log(`ReabJom API listening on http://localhost:${env.port}`);
});
