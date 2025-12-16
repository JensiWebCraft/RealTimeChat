// import { io } from "socket.io-client";

// export const socket = io("https://realtimechat-4uzm.onrender.com", {
//   transports: ["websocket"],
// });

// utils/socket.ts

import { io } from "socket.io-client";

export const socket = io("https://localhost:3000", {
  transports: ["polling", "websocket"],
});
