const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    paymentMethod: {
      type: String,
      enum: ['CASH', 'CARD', 'TRANSFER'],
      required: true
    },

    receivedBy: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ['COMPLETED', 'CANCELLED'],
      default: 'COMPLETED'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Payment', paymentSchema);