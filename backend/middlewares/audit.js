const AuditLog = require('../models/AuditLog');

const logAudit = async (user, role, action, details = {}) => {
  try {
    await AuditLog.create({
      user: user || 'Sistema / Cliente Web',
      role: role || 'GUEST',
      action,
      details
    });
  } catch (error) {
    console.error('Error al guardar auditoría:', error.message);
  }
};

module.exports = logAudit;