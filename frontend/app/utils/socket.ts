// import { io } from "socket.io-client";

// export const socket = io("https://realtimechat-4uzm.onrender.com", {
//   transports: ["websocket"],
// });

// utils/socket.ts

import { io } from "socket.io-client";

export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string, {
  transports: ["polling", "websocket"],
});
