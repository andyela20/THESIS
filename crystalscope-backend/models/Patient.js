const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const patientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true, default: () => `P-${uuidv4().slice(0, 8).toUpperCase()}` },
  surname:       { type: String, default: '' },
  firstName:     { type: String, default: '' },
  middleInitial: { type: String, default: '' },
  name:          { type: String, required: true },
  age:           { type: Number },
  sex:           { type: String },
  dob:           { type: Date },
  address:       { type: String },
  contactNumber: { type: String },
  contact:       { type: String },
  status:        { type: String, default: 'Active' },
  createdBy:     { type: String, required: true },
}, { timestamps: true });

mongoose.deleteModel(/Patient/);
module.exports = mongoose.model('Patient', patientSchema);
