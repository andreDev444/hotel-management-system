import React, { useEffect, useState } from 'react';
import './BookingModal.css';

export default function BookingModal({ room, onClose, onSaveBooking }) {
  const [guestName, setGuestName] = useState('');
  const [guestDocument, setGuestDocument] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [loading, setLoading] = useState(false);
  const [guests, setGuests] = useState([]);
  const [guestSearch, setGuestSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);

useEffect(() => {
  const fetchGuests = async () => {
    try {
      const response = await fetch(
        'http://127.0.0.1:5000/api/guests'
      );

      if (!response.ok) {
        throw new Error('No se pudieron cargar los huéspedes.');
      }

      const data = await response.json();

      setGuests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando huéspedes:', error);
    }
  };

  fetchGuests();
}, []);



  if (!room) return null;

  const roomId = room._id || room.id;
  const roomPrice = Number(room.pricePerNight || room.price || 0);

  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.ceil(
            (new Date(checkOut) - new Date(checkIn)) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const totalAmount = roomPrice * nights;
  
  const filteredGuests = guests.filter((guest) => {
  const searchText = guestSearch.trim().toLowerCase();

  if (!searchText || guest.isActive === false) {
    return false;
  }

  return (
    String(guest.name || '').toLowerCase().includes(searchText) ||
    String(guest.document || '').toLowerCase().includes(searchText) ||
    String(guest.email || '').toLowerCase().includes(searchText)
  );
});

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !guestName.trim() ||
      !guestDocument.trim() ||
      !guestEmail.trim() ||
      !guestsCount ||
      !checkIn ||
      !checkOut
    ) {
      alert('Por favor completa todos los campos.');
      return;
    }

    if (Number(guestsCount) > Number(room.capacity)) {
      alert(
        `Esta habitación tiene capacidad para máximo ${room.capacity} huésped(es).`
      );
      return;
    }

    const startDate = new Date(`${checkIn}T00:00:00`);
    const endDate = new Date(`${checkOut}T00:00:00`);

    if (endDate <= startDate) {
      alert('La fecha de Check-Out debe ser posterior al Check-In.');
      return;
    }

    try {
      setLoading(true);

      // Buscar el huésped registrado por su documento.
      const guestsResponse = await fetch(
        'http://127.0.0.1:5000/api/guests'
      );

      let guest = selectedGuest;

if (
  !guest ||
  String(guest.document).trim() !== guestDocument.trim()
) {
  const guestsResponse = await fetch(
    'http://127.0.0.1:5000/api/guests'
  );

  if (!guestsResponse.ok) {
    throw new Error('No se pudieron consultar los huéspedes.');
  }

  const guestsData = await guestsResponse.json();

  guest = guestsData.find(
    (item) =>
      String(item.document).trim() === guestDocument.trim() &&
      item.isActive !== false
  );
}

if (!guest) {
  alert(
    'No se encontró un huésped activo con ese documento. Selecciona un huésped registrado o regístralo primero en Gestión de Huéspedes.'
  );
  return;
}
      const bookingData = {
        bookingCode: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
        roomId,
        guestId: guest._id,
        guestName: guestName.trim(),
        guestDocument: guestDocument.trim(),
        guestEmail: guestEmail.trim(),
        guestsCount: Number(guestsCount),
        checkIn,
        checkOut,
        totalAmount,
        status: 'CONFIRMED',
      };

      // Guardar la reserva.
      const response = await fetch(
        'http://127.0.0.1:5000/api/bookings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
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

      if (onSaveBooking) {
        await onSaveBooking();
      }

      onClose();

      alert(
        `Reserva ${
          data.bookingCode || bookingData.bookingCode
        } creada correctamente.`
      );
    } catch (error) {
      console.error('Error enviando reserva:', error);
      alert(
        'No se pudo procesar la reserva. Comprueba que el backend esté funcionando.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="booking-overlay"
      onClick={loading ? undefined : onClose}
    >
      <section
        className="booking-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="booking-header">
          <div className="booking-heading">
            <span className="booking-eyebrow">GRAND HOTEL</span>
            <h2 id="booking-title">Nueva reserva</h2>
            <p>Completa los datos para registrar la estadía.</p>
          </div>

          <button
            type="button"
            className="booking-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar formulario"
          >
            ×
          </button>
        </header>

        <div className="booking-room-summary">
          <div className="booking-room-icon">⌂</div>
          <div className="booking-room-info">
            <span>Habitación {room.number}</span>
            <small>
              {room.type} · Capacidad: {room.capacity} huésped(es)
            </small>
          </div>
          <div className="booking-room-price">
            <strong>${roomPrice.toLocaleString('es-CO')}</strong>
            <small>por noche</small>
          </div>
        </div>

        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="booking-section-title">
            <span className="booking-section-number">01</span>
            <h3>Información del huésped</h3>
          </div>

          <div className="booking-field booking-search-field">
            <label htmlFor="guest-search">
              Buscar huésped registrado
            </label>

            <input
              id="guest-search"
              type="text"
              value={guestSearch}
              onChange={(e) => {
                setGuestSearch(e.target.value);
                setSelectedGuest(null);
              }}
              placeholder="Buscar por nombre, documento o correo..."
              autoComplete="off"
            />

            {guestSearch.trim() !== '' && !selectedGuest && (
              <div className="booking-search-results">
                {filteredGuests.length > 0 ? (
                  filteredGuests.map((guest) => (
                    <button
                      key={guest._id}
                      type="button"
                      className="booking-search-result"
                      onClick={() => {
                        setSelectedGuest(guest);
                        setGuestName(guest.name || '');
                        setGuestDocument(guest.document || '');
                        setGuestEmail(guest.email || '');
                        setGuestSearch(guest.name || '');
                      }}
                    >
                      <span className="booking-result-initial">
                        {(guest.name || '?').charAt(0).toUpperCase()}
                      </span>

                      <span className="booking-result-info">
                        <strong>{guest.name}</strong>
                        <small>
                          Documento: {guest.document}
                        </small>
                        <small>{guest.email}</small>
                      </span>

                      <span className="booking-result-action">
                        Seleccionar
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="booking-search-empty">
                    No se encontraron huéspedes activos con esa búsqueda.
                    Revisa el documento o registra al huésped en Gestión de Huéspedes.
                  </p>
                )}
              </div>
            )}

            {selectedGuest && (
              <div className="booking-selected-guest">
                <span>
                  ✓ Huésped seleccionado: <strong>{selectedGuest.name}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedGuest(null);
                    setGuestSearch('');
                    setGuestName('');
                    setGuestDocument('');
                    setGuestEmail('');
                  }}
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          <div className="booking-field">
            <label htmlFor="guest-name">Nombre completo</label>
            <input
              id="guest-name"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Nombre del huésped registrado"
              autoComplete="name"
              required
            />
          </div>

          <div className="booking-fields-grid">
            <div className="booking-field">
              <label htmlFor="guest-document">Documento de identidad</label>
              <input
                id="guest-document"
                type="text"
                value={guestDocument}
                onChange={(e) => setGuestDocument(e.target.value)}
                placeholder="Número de documento"
                required
              />
            </div>

            <div className="booking-field">
              <label htmlFor="guest-email">Correo electrónico</label>
              <input
                id="guest-email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="booking-section-title booking-stay-title">
            <span className="booking-section-number">02</span>
            <h3>Detalles de la estadía</h3>
          </div>

          <div className="booking-fields-grid">
            <div className="booking-field">
              <label htmlFor="check-in">Fecha de Check-In</label>
              <input
                id="check-in"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
              />
            </div>

            <div className="booking-field">
              <label htmlFor="check-out">Fecha de Check-Out</label>
              <input
                id="check-out"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || undefined}
                required
              />
            </div>
          </div>

          <div className="booking-field booking-guests-field">
            <label htmlFor="guests-count">Cantidad de huéspedes</label>
            <select
              id="guests-count"
              value={guestsCount}
              onChange={(e) => setGuestsCount(e.target.value)}
              required
            >
              {Array.from(
                { length: Math.max(1, Number(room.capacity) || 1) },
                (_, index) => index + 1
              ).map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? 'huésped' : 'huéspedes'}
                </option>
              ))}
            </select>
            <small className="booking-field-help">
              Máximo permitido: {room.capacity} huésped(es).
            </small>
          </div>

          <div className="booking-total">
            <div>
              <span>Resumen de la reserva</span>
              <small>
                {nights} {nights === 1 ? 'noche' : 'noches'} × $
                {roomPrice.toLocaleString('es-CO')}
              </small>
            </div>
            <div className="booking-total-amount">
              <small>Total estimado</small>
              <strong>${totalAmount.toLocaleString('es-CO')}</strong>
            </div>
          </div>

          <footer className="booking-actions">
            <button
              type="button"
              className="booking-button booking-button-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="booking-button booking-button-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Confirmar reserva'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}