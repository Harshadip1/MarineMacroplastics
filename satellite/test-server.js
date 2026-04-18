const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 6000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Basic routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/test', (req, res) => {
  res.json({ message: 'Satellite server is working!', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🛰️ Satellite server running on port ${PORT}`);
  console.log(`📸 Upload interface: http://localhost:${PORT}`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
});
