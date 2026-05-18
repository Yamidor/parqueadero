import { io } from 'socket.io-client';

// Use the same host/port as the frontend (Vite proxies /socket.io → backend)
// This works from any device on the local network
const socket = io(window.location.origin, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  path: '/socket.io',
});

export default socket;
