import React, { useState } from 'react';

export default function BookingModal({ room, onClose, onSaveBooking }) {
  const [guestName, setGuestName] = useState('');
  const [guestDocument, setGuestDocument] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [loading, setLoading] = useState(false);

  if (!room) return null;

  const roomId = room._id || room.id;
  const roomPrice = room.pricePerNight || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validar campos obligatorios
    if (
      !guestName ||
      !guestDocument ||
      !guestEmail ||
      !guestsCount ||
      !checkIn ||
      !checkOut
    ) {
      alert('Por favor completa todos los campos.');
      return;
    }

    // 2. Validar cantidad de huéspedes
    if (Number(guestsCount) > room.capacity) {
      alert(
        `Esta habitación tiene capacidad para máximo ${room.capacity} huésped(es).`
      );
      return;
    }

    // 3. Validar fechas
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    if (endDate <= startDate) {
      alert('La fecha de Check-Out debe ser posterior al Check-In.');
      return;
    }

    // 4. Calcular número de noches
    const timeDiff = endDate.getTime() - startDate.getTime();
    const calculatedNights = Math.ceil(
      timeDiff / (1000 * 60 * 60 * 24)
    );

    // 5. Calcular valor total
    const calculatedTotal = roomPrice * calculatedNights;

    // 6. Buscar huésped registrado por documento
    const guestsResponse = await fetch(
      'http://127.0.0.1:5000/api/guests'
    );

    if (!guestsResponse.ok) {
      throw new Error('No se pudieron consultar los huéspedes');
    }

    const guests = await guestsResponse.json();

    const guest = guests.find(
      (item) => item.document === guestDocument.trim()
    );

    if (!guest) {
      alert(
        'No existe un huésped registrado con ese documento. Regístralo primero en Gestión de Huéspedes.'
      );
      return;
    }
    // 7. Preparar información que coincide con Booking.js
    const bookingData = {
      bookingCode: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
      roomId,
      guestId: guest._id,   
      guestName,
      guestDocument,
      guestEmail,
      guestsCount: Number(guestsCount),
      checkIn,
      checkOut,
      totalAmount: calculatedTotal,
      status: 'CONFIRMED'
    };

    try {
      setLoading(true);
      const guestsResponse = await fetch(
  'http://127.0.0.1:5000/api/guests'
);

if (!guestsResponse.ok) {
  throw new Error('No se pudieron consultar los huéspedes');
}

const guests = await guestsResponse.json();

const guest = guests.find(
  (item) => item.document === guestDocument.trim()
);

if (!guest) {
  alert(
    'No existe un huésped registrado con ese documento. Regístralo primero en Gestión de Huéspedes.'
  );
  return;
}
      // 7. Guardar la reserva
      const response = await fetch(
        'http://127.0.0.1:5000/api/bookings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bookingData)
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(
          `Error al guardar la reserva: ${
            data.message || 'Comprueba la conexión con el servidor.'
          }`
        );
        return;
      }

      // 8. Actualizar la lista de habitaciones
      if (onSaveBooking) {
        onSaveBooking();
      }

      // 9. Cerrar modal
      onClose();

      alert(
        `Reserva ${data.bookingCode || bookingData.bookingCode} creada correctamente.`
      );
    } catch (error) {
      console.error('Error enviando reserva:', error);
      alert('No se pudo conectar con el servidor backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Registrar reserva</h2>

        <p>
          Habitación: <strong>{room.number}</strong>
        </p>

        <p>
          Tipo: <strong>{room.type}</strong>
        </p>

        <p>
          Capacidad: <strong>{room.capacity} huésped(es)</strong>
        </p>

        <p>
          Precio por noche:{' '}
          <strong>${roomPrice.toLocaleString('es-CO')}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div>
            <label>Nombre del huésped</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Nombre completo"
            />
          </div>

          <div>
            <label>Documento</label>
            <input
              type="text"
              value={guestDocument}
              onChange={(e) => setGuestDocument(e.target.value)}
              placeholder="Número de documento"
            />
          </div>

          <div>
            <label>Correo electrónico</label>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label>Cantidad de huéspedes</label>
            <input
              type="number"
              min="1"
              max={room.capacity}
              value={guestsCount}
              onChange={(e) => setGuestsCount(e.target.value)}
            />
          </div>

          <div>
            <label>Check-In</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>

          <div>
            <label>Check-Out</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>

          <div>
            <p>
              Total:{' '}
              <strong>
                $
                {(
                  roomPrice *
                  (checkIn && checkOut
                    ? Math.max(
                        0,
                        Math.ceil(
                          (new Date(checkOut) - new Date(checkIn)) /
                            (1000 * 60 * 60 * 24)
                        )
                      )
                    : 0)
                ).toLocaleString('es-CO')}
              </strong>
            </p>
          </div>

          <div>
            <button type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </button>

            <button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Confirmar reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}