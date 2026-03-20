const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Image = require('../models/Image');

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Upload image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const image = new Image({
      patientId:    req.body.patientId,
      sampleId:     req.body.sampleId,
      filename:     req.file.filename,
      originalName: req.file.originalname,
      mimetype:     req.file.mimetype,
      size:         req.file.size,
      path:         req.file.path,
    });
    await image.save();
    res.json(image);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get images by patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const images = await Image.find({ patientId: req.params.patientId });
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;