import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, switchUser } = useAuth();

  return (
    <nav style={{
      display: 'flex',
      justify: 'space-between',
      alignItems: 'center',
      backgroundColor: '#1e1e1e',
      padding: '12px 24px',
      borderRadius: '8px',
      marginBottom: '24px',
      borderBottom: '2px solid #333'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#646cff' }}>
        Hotel System
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '0.9rem', color: '#aaa' }}>
          Simular Usuario:
        </span>
        <select 
          value={user.role} 
          onChange={(e) => switchUser(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            backgroundColor: '#2d2d2d',
            color: '#fff',
            border: '1px solid #555',
            cursor: 'pointer'
          }}
        >
          <option value="ADMIN"> Admin</option>
          <option value="RECEPTIONIST"> Recepción</option>
          <option value="HOUSEKEEPING"> Limpieza</option>
          <option value="MANAGER"> Gerente</option>
        </select>

        <div style={{
          backgroundColor: '#333',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '0.85rem'
        }}>
          <b>{user.name}</b> <span style={{ color: '#888' }}>({user.role})</span>
        </div>
      </div>
    </nav>
  );
}