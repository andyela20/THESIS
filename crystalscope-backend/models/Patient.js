const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  name:      { type: String, required: true },
  age:       { type: Number },
  sex:       { type: String },
  dob:       { type: Date },
  address:   { type: String },
  status:    { type: String, default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);