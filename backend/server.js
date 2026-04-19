require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow all vercel.app and localhost origins
    if (origin.endsWith('.vercel.app') || origin.includes('localhost') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all in current open beta
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));


// Routes
app.use('/api/chat',     require('./routes/chat'));
app.use('/api/research', require('./routes/research'));
app.use('/api/widgets',  require('./routes/widgets'));
app.use('/api/tts',      require('./routes/tts'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Curalink API is running', timestamp: new Date().toISOString() });
});

// MongoDB connection (optional — works without it, uses in-memory store)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/curalink';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.warn('⚠️  MongoDB not available, using in-memory store:', err.message);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Curalink backend running on http://localhost:${PORT}`);
  console.log(`🤖 LLM: ${process.env.OLLAMA_URL} with model ${process.env.OLLAMA_MODEL}`);
});
