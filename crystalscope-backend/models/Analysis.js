const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  patientId:   { type: String, required: true },
  patientName: { type: String },
  sampleId:    { type: String, required: true },
  crystalType: { type: String, required: true },
  count:       { type: Number, required: true },
  risk:        { type: String, enum: ['High', 'Moderate', 'Low'] },
  date:        { type: Date, default: Date.now },
  imageRef:    { type: String },
  createdBy:   { type: String, required: true }, // ← idagdag ito
}, { timestamps: true });

module.exports = mongoose.model('Analysis', analysisSchema);