const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const os = require("os");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ---- File Upload Setup ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ---- Middleware ----
app.use(express.static("public"));
app.use("/uploads", express.static("uploads")); // make uploads accessible

// ---- File Upload Route ----
app.post("/upload", upload.single("file"), (req, res) => {
  const user = req.body.user || "Anonymous";
  const size = req.body.size || 0;
  const fileUrl = `/uploads/${req.file.filename}`;

  io.emit("fileShared", { 
    user, 
    fileName: req.file.originalname, 
    fileUrl, 
    size 
  });

  res.json({ status: "ok", fileUrl });
});

// ---- Socket.IO Chat Handling ----
io.on("connection", (socket) => {
  console.log("New user connected");

  socket.on("chatMessage", (data) => {
    io.emit("chatMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// ---- Start Server ----
const PORT = 3000;
const HOST = "0.0.0.0"; // bind to all interfaces for LAN access

function getLanIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

server.listen(PORT, HOST, () => {
  const lan = getLanIPv4();
  console.log(`Server running on http://localhost:${PORT}`);
  if (lan) {
    console.log(`LAN address:    http://${lan}:${PORT}`);
  }
});
