// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('joinRoom', (username) => {
    socket.join(username);
    console.log(`${username} joined room: ${username}`);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });

  socket.on('message', ({ to, from, message }) => {
    console.log('message received from', from, 'to', to, ':', message);
    io.to(to).emit('message', { from, message }); // Send message to specific room
  });
});

server.listen(3001, () => {
  console.log('listening on *:3001');
});

// User signup
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful', username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
