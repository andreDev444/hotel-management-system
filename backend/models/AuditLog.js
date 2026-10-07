const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: String, required: true },      // Ej. "Carlos Ruiz" o "Sistema/Cliente"
  role: { type: String, default: 'PUBLIC' },   // Ej. "HOUSEKEEPING", "ADMIN"
  action: { type: String, required: true },    // Ej. "Marcó habitación 305 como limpia"
  details: { type: Object },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);