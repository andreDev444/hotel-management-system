import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulación de redirección por rol hasta conectar endpoint de Auth
    if (email.includes('admin')) navigate('/admin');
    else if (email.includes('recep')) navigate('/recepcion');
    else if (email.includes('aseo')) navigate('/limpieza');
    else if (email.includes('gerente')) navigate('/gerencia');
    else alert('Usuario no reconocido');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#121212', color: '#fff' }}>
      <form onSubmit={handleLogin} style={{ backgroundColor: '#1e1e1e', padding: '32px', borderRadius: '8px', width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2>🔐 Acceso Empleados</h2>
        <input type="email" placeholder="Correo corporativo" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2d2d2d', color: '#fff' }} />
        <input type="password" placeholder="Contraseña" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2d2d2d', color: '#fff' }} />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Iniciar Sesión</button>
      </form>
    </div>
  );
}