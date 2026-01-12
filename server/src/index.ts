import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { initializeSocketIO } from "./socket.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/story-mosaic";

const startServer = async () => {
  try {
    await connectDatabase(MONGO_URI);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      // allow other http verbs used by the web client for REST endpoints
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    },
  });

  app.set("io", io); // Make io accessible to router
  initializeSocketIO(io);

  httpServer.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
    console.log(` API available at http://localhost:${PORT}`);
    console.log(` Health check at http://localhost:${PORT}/health`);
    console.log(" Socket.IO server initialized");
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exitCode = 1;
});

export default app;
