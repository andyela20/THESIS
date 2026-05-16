const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({

    
  patientId: { type: String, unique: true, default: () => `P-${uuidv4().slice(0, 8).toUpperCase()}` },

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

mongoose.deleteModel(/Patient/);
module.exports = mongoose.model("Patient", PatientSchema);
