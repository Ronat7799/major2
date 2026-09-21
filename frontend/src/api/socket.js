import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;
let socketToken = null;

// Lazily creates one shared socket per tab, authenticated with the current
// session token. Re-login with a different token reconnects it.
export function getSocket() {
  const token = sessionStorage.getItem('reabjom_token');
  if (!token) {
    return null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, { auth: { token }, autoConnect: true });
    socketToken = token;
  } else if (socketToken !== token) {
    socketToken = token;
    socket.auth = { token };
    socket.disconnect().connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
}
