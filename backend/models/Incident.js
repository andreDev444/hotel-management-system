
const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },

    roomNumber: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    reportedBy: {
      type: String,
      required: true,
      trim: true
    },

    role: {
      type: String,
      default: 'HOUSEKEEPING',
      enum: [
        'ADMIN',
        'MANAGER',
        'RECEPTIONIST',
        'HOUSEKEEPING'
      ]
    },

    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM'
    },

    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED'],
      default: 'PENDING'
    },

    resolutionNotes: {
      type: String,
      trim: true,
      default: ''
    },

    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

incidentSchema.index({ roomId: 1, status: 1 });
incidentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);
