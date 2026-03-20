const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes  ← IDAGDAG ITO
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/analyses', require('./routes/analyses'));
app.use('/api/images',   require('./routes/images'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'CrystalScope backend is running!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected!'))
  .catch((err) => console.log('❌ MongoDB error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});