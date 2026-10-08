const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    document: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Guest', guestSchema);