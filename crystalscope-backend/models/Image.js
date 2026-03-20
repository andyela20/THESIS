const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  patientId:    { type: String, required: true },
  sampleId:     { type: String, required: true },
  filename:     { type: String, required: true },
  originalName: { type: String },
  mimetype:     { type: String },
  size:         { type: Number },
  path:         { type: String },
  uploadedAt:   { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Image', imageSchema);