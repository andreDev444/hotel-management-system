import React, { useState } from 'react';

export default function BookingModal({ room, onClose, onSaveBooking }) {
  const [guestName, setGuestName] = useState('');
  const [document, setDocument] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!guestName || !document || !checkIn || !checkOut) {
      alert('Por favor completa todos los campos');
      return;
    }

    const newBooking = {
      bookingCode: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
      roomId: room.id,
      roomNumber: room.number,
      guestName,
      document,
      checkIn,
      checkOut,
      status: 'CONFIRMED',
      totalAmount: room.price
    };

    onSaveBooking(newBooking);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1e1e1e',
        padding: '24px',
        borderRadius: '8px',
        width: '400px',
        color: '#fff',
        border: '1px solid #444'
      }}>
        <h2>📅 Crear Reserva - Habitación {room.number}</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Precio/Noche: ${room.price.toLocaleString()}</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem' }}>Nombre Completo del Huésped:</label>
            <input 
              type="text" 
              value={guestName} 
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#2d2d2d', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem' }}>Documento de Identidad:</label>
            <input 
              type="text" 
              value={document} 
              onChange={(e) => setDocument(e.target.value)}
              placeholder="Ej. 1098765432"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#2d2d2d', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem' }}>Fecha de Entrada (Check-In):</label>
            <input 
              type="date" 
              value={checkIn} 
              onChange={(e) => setCheckIn(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#2d2d2d', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem' }}>Fecha de Salida (Check-Out):</label>
            <input 
              type="date" 
              value={checkOut} 
              onChange={(e) => setCheckOut(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#2d2d2d', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#444', color: '#fff', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#22c55e', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
              Confirmar Reserva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}