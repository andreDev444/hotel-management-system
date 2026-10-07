const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  type: { type: String, required: true }, // Sencilla, Doble, Suite, etc.
  capacity: { type: Number, required: true },
  pricePerNight: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'OUT_OF_SERVICE'], 
    default: 'AVAILABLE' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);