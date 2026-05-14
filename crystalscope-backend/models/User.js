const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, default: null },   // ← CHANGED: required → default null (Google users have no password)
  role:     { type: String, default: 'admin' },

  // ── ADD THESE TWO ──
  email:    { type: String, default: null },
  googleId: { type: String, default: null },

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);