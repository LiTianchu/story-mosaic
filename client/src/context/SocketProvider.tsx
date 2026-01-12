import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SocketContext } from "./SocketContext";

// Use the same base URL as the API, but without the /api path
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  (typeof window !== "undefined"
    ? window.location.hostname === "localhost"
      ? "http://localhost:5001"
      : window.location.origin
    : "http://localhost:5001");

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initialize Socket.IO client and connect to server
    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketInstance.on("connect", () => {
      console.log("Socket.IO connected:", socketInstance.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected:", reason);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    // Set socket only after it's fully configured
    setSocket(socketInstance);

    // Cleanup function
    return () => {
      console.log("Cleaning up socket connection");
      socketInstance.disconnect();
    };
  }, []); // Empty dependency array - only run once
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
