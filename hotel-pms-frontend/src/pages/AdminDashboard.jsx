import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'RECEPTIONIST' });

  useEffect(() => {
    fetchUsers();
    fetchAudit();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('http://localhost:5000/api/users');
    const data = await res.json();
    setUsers(data);
  };

  const fetchAudit = async () => {
    const res = await fetch('http://localhost:5000/api/audit');
    const data = await res.json();
    setAuditLogs(data);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newUser, executedBy: 'Admin Principal' })
    });
    setNewUser({ name: '', email: '', password: '', role: 'RECEPTIONIST' });
    fetchUsers();
    fetchAudit();
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#121212', color: '#fff', minHeight: '100vh' }}>
      <h1>⚙️ Panel de Administración Global</h1>
      
      {/* Menú de pestañas */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('users')} style={tabBtn(activeTab === 'users')}>👥 Empleados</button>
        <button onClick={() => setActiveTab('audit')} style={tabBtn(activeTab === 'audit')}>📜 Bitácora de Auditoría</button>
      </div>

      {activeTab === 'users' && (
        <div>
          <h3>Crear Nuevo Empleado</h3>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: '#1e1e1e', padding: '16px', borderRadius: '8px' }}>
            <input placeholder="Nombre" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} style={inputStyle} />
            <input placeholder="Correo" type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} style={inputStyle} />
            <input placeholder="Contraseña" type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} style={inputStyle} />
            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={inputStyle}>
              <option value="RECEPTIONIST">Recepcionista</option>
              <option value="HOUSEKEEPING">Personal Limpieza</option>
              <option value="MANAGER">Gerente</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <button type="submit" style={{ backgroundColor: '#22c55e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar</button>
          </form>

          <h3>Lista de Empleados</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#1e1e1e' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>
                <th style={{ padding: '10px' }}>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid #2d2d2d' }}>
                  <td style={{ padding: '10px' }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td><strong style={{ color: '#3b82f6' }}>{u.role}</strong></td>
                  <td>{u.isActive ? '🟢 Activo' : '🔴 Inactivo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'audit' && (
        <div>
          <h3>📜 Registro de Acciones y Auditoría</h3>
          <div style={{ backgroundColor: '#1e1e1e', borderRadius: '8px', padding: '16px' }}>
            {auditLogs.map(log => (
              <div key={log._id} style={{ borderBottom: '1px solid #333', padding: '8px 0', fontSize: '0.9rem' }}>
                <span style={{ color: '#888' }}>[{new Date(log.timestamp).toLocaleString()}]</span> {' '}
                <strong style={{ color: '#eab308' }}>{log.user}</strong> ({log.role}): {' '}
                <span>{log.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const tabBtn = (active) => ({
  padding: '10px 20px',
  backgroundColor: active ? '#3b82f6' : '#2d2d2d',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold'
});

const inputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2d2d2d', color: '#fff' };