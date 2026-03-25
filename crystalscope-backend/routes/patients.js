const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const jwt = require('jsonwebtoken');

// Helper — kunin ang username mula sa token
const getUserFromToken = (req) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.username;
  } catch {
    return null;
  }
};

// Get all patients — ng current user lang
router.get('/', async (req, res) => {
  try {
    const username = getUserFromToken(req);
    if (!username) return res.status(401).json({ message: 'Unauthorized' });
    const patients = await Patient.find({ createdBy: username }).sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search patients by name or patientId — must be ABOVE /:id routes
router.get('/search', async (req, res) => {
  try {
    const username = getUserFromToken(req);
    if (!username) return res.status(401).json({ message: 'Unauthorized' });

    const q = req.query.q || '';
    const patients = await Patient.find({
      createdBy: username,
      $or: [
        { name:      { $regex: q, $options: 'i' } },
        { patientId: { $regex: q, $options: 'i' } },
      ]
    }).limit(10).sort({ createdAt: -1 });

    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add patient — i-tag ang createdBy
router.post('/', async (req, res) => {
  try {
    const username = getUserFromToken(req);
    if (!username) return res.status(401).json({ message: 'Unauthorized' });
    const patient = new Patient({ ...req.body, createdBy: username });
    await patient.save();
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update patient
router.put('/:id', async (req, res) => {
  try {
    const username = getUserFromToken(req);
    const patient = await Patient.findOneAndUpdate(
      { patientId: req.params.id, createdBy: username },
      req.body,
      { new: true }
    );
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete patient
router.delete('/:id', async (req, res) => {
  try {
    const username = getUserFromToken(req);
    await Patient.findOneAndDelete({ patientId: req.params.id, createdBy: username });
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;