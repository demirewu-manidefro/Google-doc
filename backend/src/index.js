require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const setupYjsWebsockets = require('./websockets/yjsSetup');
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO for general notifications/presence (Yjs will use its own WS handling)
io.on('connection', (socket) => {
  console.log('User connected to Socket.IO', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

// Setup Yjs WebSockets
setupYjsWebsockets(server);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
