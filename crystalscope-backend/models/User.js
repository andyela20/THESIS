const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  password: {
    type: String,
    default: null
  },

  email: {
    type: String,
    default: null,
    trim: true,
    lowercase: true,
    index: true
  },

  googleId: {
    type: String,
    default: null,
    index: true
  },

  displayName: {
    type: String,
    default: null
  },

  avatar: {
    type: String,
    default: null
  },

  provider: {
    type: String,
    enum: ["local", "google"],
    default: "local"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("User", UserSchema);
