import React, { useState } from 'react';

export default function PublicBooking() {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [roomType, setRoomType] = useState('ALL');
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  const handleSearchAndBook = (e) => {
    e.preventDefault();
    const code = 'RES-' + Math.floor(100000 + Math.random() * 900000);
    setBookingConfirmed(code);
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#121212', color: '#fff', minHeight: '100vh' }}>
      <h2>📅 Reserva tu Estancia</h2>
      {!bookingConfirmed ? (
        <form onSubmit={handleSearchAndBook} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', backgroundColor: '#1e1e1e', padding: '24px', borderRadius: '8px' }}>
          <div>
            <label>Fecha de Entrada:</label>
            <input type="date" required value={checkIn} onChange={(e) => setCheckIn(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </div>
          <div>
            <label>Fecha de Salida:</label>
            <input type="date" required value={checkOut} onChange={(e) => setCheckOut(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </div>
          <div>
            <label>Número de Huéspedes:</label>
            <input type="number" min="1" max="6" value={guests} onChange={(e) => setGuests(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </div>
          <div>
            <label>Tipo de Habitación:</label>
            <select value={roomType} onChange={(e) => setRoomType(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
              <option value="ALL">Todas las habitaciones</option>
              <option value="Sencilla">Sencilla</option>
              <option value="Doble">Doble</option>
              <option value="Suite">Suite</option>
            </select>
          </div>
          <button type="submit" style={{ padding: '12px', backgroundColor: '#22c55e', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Confirmar Reserva
          </button>
        </form>
      ) : (
        <div style={{ backgroundColor: '#1e1e1e', padding: '24px', borderRadius: '8px', maxWidth: '500px' }}>
          <h3 style={{ color: '#22c55e' }}>🎉 ¡Reserva Confirmada!</h3>
          <p>Tu código de reserva es: <strong style={{ fontSize: '1.4rem', color: '#eab308' }}>{bookingConfirmed}</strong></p>
          <p>Guarda este código para realizar tu Check-In al llegar al hotel.</p>
        </div>
      )}
    </div>
  );
}