import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '40px', backgroundColor: '#121212', color: '#fff', minHeight: '100vh', textAlign: 'center' }}>
      <h1>🏨 Bienvenido a Grand Hotel Boutique</h1>
      <p style={{ fontSize: '1.2rem', color: '#aaa' }}>Disfruta de la mejor experiencia de confort y lujo.</p>

      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <button 
          onClick={() => navigate('/reservar')} 
          style={{ padding: '15px 30px', fontSize: '1.1rem', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          📅 Reservar una Habitación
        </button>

        <button 
          onClick={() => navigate('/login')} 
          style={{ padding: '15px 30px', fontSize: '1.1rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🔐 Acceso Empleados
        </button>
      </div>
    </div>
  );
}