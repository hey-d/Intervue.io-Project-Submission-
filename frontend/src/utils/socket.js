// src/utils/socket.js
import { io } from 'socket.io-client';
const URL = import.meta.env.VITE_API_URL || 'https://live-poll-backend-6z5n.onrender.com';
const socket = io(URL, { autoConnect: true });
export default socket;
