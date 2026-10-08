const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingCode: { type: String, required: true, unique: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },

  guestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest'
  },

  guestName: { type: String, required: true },
  guestDocument: { type: String, required: true },
  guestEmail: { type: String, required: true },
  guestsCount: { type: Number, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  totalAmount: { type: Number, required: true },
  totalPaid: { type: Number, default: 0 },
  paymentMethod: { type: String },
  status: { 
    type: String, 
    enum: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'], 
    default: 'CONFIRMED' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);