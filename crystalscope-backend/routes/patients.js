const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');

// Get all patients
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add patient
router.post('/', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update patient
router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { patientId: req.params.id },
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
    await Patient.findOneAndDelete({ patientId: req.params.id });
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;