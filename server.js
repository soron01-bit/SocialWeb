const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Database initialized
console.log('JSON database ready');

// CORS Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/social', require('./routes/social'));

// Serve HTML home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Welcome route
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Node.js Authentication System API',
    endpoints: {
      signup: 'POST /api/auth/signup',
      signin: 'POST /api/auth/signin',
      getCurrentUser: 'GET /api/auth/me (requires token)'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;
const MAX_PORT_ATTEMPTS = 20;

function startServer(port, attemptsLeft) {
  const server = app.listen(port, () => {
    console.log(`Server started on port ${port}`);
    console.log(`http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.warn(`Port ${port} is busy, trying port ${port + 1}...`);
      startServer(port + 1, attemptsLeft - 1);
      return;
    }

    console.error('Server failed to start:', error.message || error);
    process.exit(1);
  });
}

startServer(DEFAULT_PORT, MAX_PORT_ATTEMPTS);
