const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  dob: {
    type: String,
    default: ""
  },

  age: {
    type: String,
    default: ""
  },

  sex: {
    type: String,
    default: ""
  },

  address: {
    type: String,
    default: ""
  },

  contact: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    default: "Active"
  },

  createdBy: {
    type: String,
    default: "unknown"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Patient", PatientSchema);
