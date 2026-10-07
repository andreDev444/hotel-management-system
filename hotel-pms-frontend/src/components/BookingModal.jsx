import React, { useState } from 'react';

export default function BookingModal({ room, onClose, onSaveBooking }) {
  const [guestName, setGuestName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [nationality, setNationality] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [loading, setLoading] = useState(false);

  if (!room) return null;

  const roomPrice = room.price || room.pricePerNight || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guestName || !document || !email || !nationality || !checkIn || !checkOut) {
      alert('Por favor completa todos los campos del huésped.');
      return;
    }

    setLoading(true);

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const calculatedNights = Math.ceil(timeDiff / (1000 * 3600 * 24)) || 1;
    const calculatedTotal = roomPrice * calculatedNights;

    const bookingData = {
  bookingCode: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
  room: room._id || room.id,
  roomId: room._id || room.id,
  roomNumber: room.number,
  guestName,
  customerName: guestName,
  document,
  identification: document,
  email,
  nationality,
  checkIn,
  checkOut,
  startDate: checkIn,
  endDate: checkOut,
  nights: calculatedNights,
  status: 'CONFIRMED',
  totalAmount: calculatedTotal,
  totalPrice: calculatedTotal
};

    try {
      const response = await fetch('http://127.0.0.1:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        await fetch(`http://127.0.0.1:5000/api/rooms/${room._id || room.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'OCCUPIED',
            user: 'Recepción',
            role: 'RECEPTIONIST'
          })
        });

        if (onSaveBooking) onSaveBooking();
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Error al guardar la reserva: ${errorData.message || 'Comprueba la conexión con la base de datos.'}`);
      }
    } catch (error) {
      console.error('Error enviando reserva:', error);
      alert('No se pudo conectar con el servidor backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1e1e1e', padding: '24px', borderRadius: '12px',
        width: '450px', color: '#fff', border: '1px solid #444', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <h2>🔑 Check-In / Reserva - Hab. {room.number}</h2>
        <p style={{ color: '#22c55e', fontWeight: 'bold', margin: '5px 0 15px 0' }}>
          Precio por Noche: ${roomPrice.toLocaleString('es-CO')}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.85rem' }}>Nombre Completo del Huésped:</label>
            <input 
              type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #555', backgroundColor: '#2d2d2d', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.85rem' }}>Documento / Cédula:</label>
              <input 
                type="text" value={document} onChange={(e) => setDocument(e.target.value)}
                placeholder="Ej. 1098765432"
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #555', backgroundColor: '#2d2d2d', color: '#fff' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.85rem' }}>Nacionalidad:</label>
              <input 
                type="text" value={nationality} onChange={(e) => setNationality(e.target.value)}
                placeholder="Ej. Colombiana"
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #555', backgroundColor: '#2d2d2d', color: '#fff' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem' }}>Correo Electrónico (Email):</label>
            <input 
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="juan.perez@email.com"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #555', backgroundColor: '#2d2d2d', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.85rem' }}>Check-In:</label>
              <input 
                type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #555', backgroundColor: '#2d2d2d', color: '#fff' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.85rem' }}>Check-Out:</label>
              <input 
                type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #555', backgroundColor: '#2d2d2d', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#444', color: '#fff', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ padding: '10px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#22c55e', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? 'Guardando...' : 'Confirmar Check-In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}