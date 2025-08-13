import { io } from "socket.io-client";
const URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const socket = io(URL, { autoConnect: true });
if (import.meta.env.DEV) window.__socket = socket;
export default socket;
