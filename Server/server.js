const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { ExpressPeerServer } = require("peer");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*'
  }
});

// Create a PeerServer
const opinions = {
  debug: true,
};

const peerServer = ExpressPeerServer(server, opinions);
app.use("/peerjs", peerServer);

// Proxy requests to the Angular development server during development
if (process.env.NODE_ENV === "development") {
  const { createProxyMiddleware } = require("http-proxy-middleware");
  app.use(
    "/",
    createProxyMiddleware({
      target: "http://localhost:4200", // Adjust this to the address of your Angular development server
      changeOrigin: true,
    })
  );
}

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    setTimeout(() => {
      io.to(roomId).emit("user-connected", userId);
    }, 1000);

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName); // Broadcast the message to all users in the room
    });
  });
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});


