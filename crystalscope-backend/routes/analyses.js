const express = require('express');
const router = express.Router();
const Analysis = require('../models/Analysis');
const jwt = require('jsonwebtoken');

const getUserFromToken = (req) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.username;
  } catch {
    return null;
  }
};

// Get all analyses — ng current user lang
router.get('/', async (req, res) => {
  try {
    const username = getUserFromToken(req);
    if (!username) return res.status(401).json({ message: 'Unauthorized' });
    const analyses = await Analysis.find({ createdBy: username }).sort({ createdAt: -1 });
    res.json(analyses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get analyses by patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const username = getUserFromToken(req);
    const analyses = await Analysis.find({ patientId: req.params.patientId, createdBy: username });
    res.json(analyses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save analysis results
router.post('/', async (req, res) => {
  try {
    const username = getUserFromToken(req);
    if (!username) return res.status(401).json({ message: 'Unauthorized' });
    const records = req.body.map(r => ({ ...r, createdBy: username }));
    const saved = await Analysis.insertMany(records);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete analysis
router.delete('/:id', async (req, res) => {
  try {
    await Analysis.findByIdAndDelete(req.params.id);
    res.json({ message: 'Analysis deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;