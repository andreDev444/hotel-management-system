
import React, { useState, useEffect } from 'react';
import BookingModal from '../components/BookingModal.jsx';
import Sidebar from '../components/Sidebar.jsx';
import './ReceptionPanel.css';

const STATUS_MAP = {
  AVAILABLE: {
    label: 'Disponible',
    color: '#587653',
    bg: '#EAF0E5',
  },
  CLEANING: {
    label: 'En Aseo',
    color: '#8B7D72',
    bg: '#EDE8E2',
  },
  OCCUPIED: {
    label: 'Ocupada',
    color: '#80634F',
    bg: '#F0E7DF',
  },
  RESERVED: {
    label: 'Reservada',
    color: '#9A783E',
    bg: '#F5EEDC',
  },
  OUT_OF_SERVICE: {
    label: 'Mantenimiento',
    color: '#A34F45',
    bg: '#F5E6E3',
  },
};

export default function ReceptionPanel() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const [consumptionModal, setConsumptionModal] = useState(null);
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  // Obtener habitaciones
  const fetchRooms = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/rooms');
      const data = await res.json();
      console.log('Habitaciones recibidas:', data);
      setRooms(data);
    } catch (err) {
      console.error('Error al cargar habitaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado de habitación
  const handleStatusChange = async (roomId, newStatus) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/rooms/${roomId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            user: 'Recepción',
            role: 'RECEPTIONIST',
          }),
        }
      );

      if (!res.ok) {
        throw new Error('No se pudo actualizar el estado de la habitación');
      }

      await fetchRooms();
    } catch (err) {
      console.error('Error cambiando estado:', err);
    }
  };

  // Check-in
  const handleCheckIn = async (room) => {
    try {
      const bookingsResponse = await fetch(
        'http://127.0.0.1:5000/api/bookings'
      );

      if (!bookingsResponse.ok) {
        throw new Error('No se pudieron obtener las reservas');
      }

      const bookings = await bookingsResponse.json();

      const booking = bookings.find(
        (item) =>
          String(item.roomId?._id || item.roomId) === String(room._id) &&
          item.status === 'CONFIRMED'
      );

      if (!booking) {
        alert('No se encontró una reserva confirmada para esta habitación.');
        return;
      }

      const bookingResponse = await fetch(
        `http://127.0.0.1:5000/api/bookings/${booking._id}/check-in`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            executedBy: 'Recepción',
            role: 'RECEPTIONIST',
          }),
        }
      );

      if (!bookingResponse.ok) {
        throw new Error('No se pudo realizar el Check-In');
      }

      await handleStatusChange(room._id, 'OCCUPIED');

      alert(`Check-In realizado correctamente para ${booking.guestName}.`);
      await fetchRooms();
    } catch (err) {
      console.error('Error realizando Check-In:', err);
      alert('No se pudo realizar el Check-In.');
    }
  };

  // Cancelar reserva
  const handleCancelBooking = async (room) => {
    try {
      const bookingsResponse = await fetch(
        'http://127.0.0.1:5000/api/bookings'
      );

      if (!bookingsResponse.ok) {
        throw new Error('No se pudieron obtener las reservas');
      }

      const bookings = await bookingsResponse.json();

      const booking = bookings.find(
        (item) =>
          String(item.roomId?._id || item.roomId) === String(room._id) &&
          item.status === 'CONFIRMED'
      );

      if (!booking) {
        alert('No se encontró una reserva confirmada para esta habitación.');
        return;
      }

      const confirmed = window.confirm(
        `¿Deseas cancelar la reserva de ${booking.guestName}?`
      );

      if (!confirmed) return;

      const response = await fetch(
        `http://127.0.0.1:5000/api/bookings/${booking._id}/cancel`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            executedBy: 'Recepción',
            role: 'RECEPTIONIST',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('No se pudo cancelar la reserva');
      }

      alert(`Reserva de ${booking.guestName} cancelada correctamente.`);
      await fetchRooms();
    } catch (err) {
      console.error('Error cancelando reserva:', err);
      alert('No se pudo cancelar la reserva.');
    }
  };

  // Check-out
  const handleCheckOut = async (room) => {
    try {
      const bookingsResponse = await fetch(
        'http://127.0.0.1:5000/api/bookings'
      );

      if (!bookingsResponse.ok) {
        throw new Error('No se pudieron obtener las reservas');
      }

      const bookings = await bookingsResponse.json();

      const booking = bookings.find(
        (item) =>
          String(item.roomId?._id || item.roomId) === String(room._id) &&
          item.status === 'CHECKED_IN'
      );

      if (!booking) {
        alert('No se encontró una reserva activa para esta habitación.');
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:5000/api/bookings/${booking._id}/check-out`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            executedBy: 'Recepción',
            role: 'RECEPTIONIST',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('No se pudo realizar el Check-Out');
      }

      alert(`Check-Out realizado correctamente para ${booking.guestName}.`);
      await fetchRooms();
    } catch (err) {
      console.error('Error realizando Check-Out:', err);
      alert('No se pudo realizar el Check-Out.');
    }
  };

  // Consumo adicional
  const handleAddConsumption = async (e) => {
    e.preventDefault();

    if (!itemDescription || !itemPrice) return;

    alert(
      `Consumo de "${itemDescription}" por $${Number(
        itemPrice
      ).toLocaleString('es-CO')} cargado con éxito a la habitación ${
        consumptionModal.number
      }.`
    );

    setItemDescription('');
    setItemPrice('');
    setConsumptionModal(null);
  };

  // Interfaz
  return (
    <div className="pms-layout">
      <Sidebar />

      <main className="pms-main">
        <div className="reception-content">
          <header className="reception-header">
            <h1>Panel de recepción</h1>
            <p>
              Gestión de huéspedes, consumos extra, estados y Check-In /
              Check-Out
            </p>
          </header>

          {loading ? (
            <p className="reception-loading">
              Cargando habitaciones desde la base de datos...
            </p>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room) => {
                const statusInfo = STATUS_MAP[room.status] || {
                  label: room.status,
                  color: '#8B7D72',
                  bg: '#EDE8E2',
                };

                const price = room.price || room.pricePerNight || 0;

                return (
                  <div
                    key={room._id || room.id}
                    className="room-card"
                    style={{ '--status-color': statusInfo.color }}
                  >
                    <div>
                      <div className="room-card-heading">
                        <h3>Habitación {room.number}</h3>

                        <span
                          className="room-status"
                          style={{
                            '--status-color': statusInfo.color,
                            '--status-bg': statusInfo.bg,
                          }}
                        >
                          <span className="status-dot" />
                          {statusInfo.label}
                        </span>
                      </div>

                      <p className="room-detail">
                        Tipo: <strong>{room.type}</strong>
                      </p>

                      <p className="room-price">
                        Tarifa:{' '}
                        <strong>
                          ${Number(price).toLocaleString('es-CO')}
                        </strong>
                        <span> / noche</span>
                      </p>

                      <div className="room-status-control">
                        <label htmlFor={`status-${room._id || room.id}`}>
                          Cambiar estado
                        </label>

                        <select
                          id={`status-${room._id || room.id}`}
                          value={room.status}
                          onChange={(e) =>
                            handleStatusChange(
                              room._id || room.id,
                              e.target.value
                            )
                          }
                        >
                          <option value="AVAILABLE">Disponible</option>
                          <option value="OCCUPIED">Ocupada</option>
                          <option value="CLEANING">En Aseo</option>
                          <option value="RESERVED">Reservada</option>
                          <option value="OUT_OF_SERVICE">Mantenimiento</option>
                        </select>
                      </div>
                    </div>

                    <div className="room-actions">
                      {room.status === 'AVAILABLE' && (
                        <button
                          className="action-button button-coffee"
                          onClick={() => {
                            setSelectedRoom(room);
                          }}
                        >
                          Crear reserva
                        </button>
                      )}

                      {room.status === 'RESERVED' && (
                        <>
                          <button
                            className="action-button button-coffee"
                            onClick={() => handleCheckIn(room)}
                          >
                            Registrar Check-In
                          </button>

                          <button
                            className="action-button button-danger"
                            onClick={() => handleCancelBooking(room)}
                          >
                            Cancelar reserva
                          </button>
                        </>
                      )}

                      {room.status === 'OCCUPIED' && (
                        <>
                          <button
                            className="action-button button-sand"
                            onClick={() => setConsumptionModal(room)}
                          >
                            Cargar consumo adicional
                          </button>

                          <button
                            className="action-button button-taupe"
                            onClick={() => handleCheckOut(room)}
                          >
                            Registrar Check-Out
                          </button>
                        </>
                      )}

                      {room.status === 'CLEANING' && (
                        <button
                          className="action-button button-success"
                          onClick={() =>
                            handleStatusChange(
                              room._id || room.id,
                              'AVAILABLE'
                            )
                          }
                        >
                          Aseo finalizado
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal de reserva */}
          {selectedRoom && (
            <BookingModal
              room={selectedRoom}
              onClose={() => setSelectedRoom(null)}
              onSaveBooking={fetchRooms}
            />
          )}

          {/* Modal de consumos */}
          {consumptionModal && (
            <div
              className="modal-overlay"
              onClick={() => setConsumptionModal(null)}
            >
              <div
                className="consumption-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <h2>Agregar consumo</h2>

                <p className="consumption-subtitle">
                  Habitación {consumptionModal.number}
                </p>

                <form
                  onSubmit={handleAddConsumption}
                  className="consumption-form"
                >
                  <label htmlFor="item-description">Descripción</label>
                  <input
                    id="item-description"
                    type="text"
                    placeholder="Ej. Servicio de minibar o cena"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    required
                  />

                  <label htmlFor="item-price">Valor en pesos</label>
                  <input
                    id="item-price"
                    type="number"
                    min="1"
                    placeholder="Valor del consumo"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    required
                  />

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="action-button button-light"
                      onClick={() => setConsumptionModal(null)}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="action-button button-coffee"
                    >
                      Guardar consumo
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}