const express = require('express');
const router = express.Router();
const Analysis = require('../models/Analysis');

// Get all analyses
router.get('/', async (req, res) => {
  try {
    const analyses = await Analysis.find().sort({ createdAt: -1 });
    res.json(analyses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get analyses by patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const analyses = await Analysis.find({ patientId: req.params.patientId });
    res.json(analyses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save analysis results
router.post('/', async (req, res) => {
  try {
    const records = req.body;
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