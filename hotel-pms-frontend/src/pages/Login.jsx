
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const user = await login(email, password);

      switch (user.role) {
        case 'ADMIN':
          navigate('/admin');
          break;

        case 'MANAGER':
          navigate('/gerencia');
          break;

        case 'RECEPTIONIST':
          navigate('/recepcion');
          break;

        case 'HOUSEKEEPING':
          navigate('/limpieza');
          break;

        default:
          setError('El rol de usuario no es válido.');
      }
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
    }
  };

  return (
    <main className="login-page">
      <div className="login-background"></div>

      <section className="login-container">
        <div className="login-brand">
          <span className="login-monogram">GH</span>
          <span>GRAND HOTEL BOUTIQUE</span>
        </div>

        <div className="login-heading">
          <span className="login-eyebrow">PORTAL CORPORATIVO</span>
          <h1>Bienvenido</h1>
          <p>Ingresa tus credenciales para continuar.</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-field">
            <label htmlFor="employee-email">Correo corporativo</label>
            <input
              id="employee-email"
              type="email"
              placeholder="nombre@grandhotel.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="login-field">
            <label htmlFor="employee-password">Contraseña</label>
            <input
              id="employee-password"
              type="password"
              placeholder="Ingresa tu contraseña"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Iniciar sesión'}
            <span>→</span>
          </button>
        </form>

        <div className="login-divider"></div>

        <p className="login-security">
          Acceso exclusivo para el personal del hotel
        </p>
      </section>

      <button
        className="login-back"
        type="button"
        onClick={() => navigate('/')}
      >
        ← Volver al inicio
      </button>
    </main>
  );
}
