import React, { useState, useEffect } from 'react';
import BookingModal from '../components/BookingModal.jsx';

const STATUS_MAP = {
  AVAILABLE: {
    label: '🟢 Disponible',
    color: '#22c55e',
    bg: '#14532d'
  },
  CLEANING: {
    label: '🟠 En Aseo',
    color: '#f97316',
    bg: '#7c2d12'
  },
  OCCUPIED: {
    label: '🔵 Ocupada',
    color: '#3b82f6',
    bg: '#1e3a8a'
  },
  RESERVED: {
    label: '🟡 Reservada',
    color: '#eab308',
    bg: '#713f12'
  },
  OUT_OF_SERVICE: {
    label: '🔴 Mantenimiento',
    color: '#ef4444',
    bg: '#7f1d1d'
  }
};

export default function ReceptionPanel() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado para consumos adicionales
  const [consumptionModal, setConsumptionModal] = useState(null);
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  // ======================================================
  // OBTENER HABITACIONES
  // ======================================================

  const fetchRooms = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/rooms');
      const data = await res.json();
      console.log('Habitaciones recibidas:', data);

      console.log('HABITACIONES RECIBIDAS:', data);

      setRooms(data);
    } catch (err) {
      console.error('Error al cargar habitaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // CAMBIAR ESTADO DE HABITACIÓN
  // ======================================================

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/rooms/${roomId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: newStatus,
            user: 'Recepción',
            role: 'RECEPTIONIST'
          })
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

  // ======================================================
  // CHECK-IN
  // ======================================================

  const handleCheckIn = async (room) => {
  try {
    // Buscar la reserva CONFIRMED de esta habitación
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
      alert(
        'No se encontró una reserva confirmada para esta habitación.'
      );
      return;
    }

    // Actualizar reserva a CHECKED_IN
    const bookingResponse = await fetch(
      `http://127.0.0.1:5000/api/bookings/${booking._id}/check-in`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          executedBy: 'Recepción',
          role: 'RECEPTIONIST'
        })
      }
    );

    if (!bookingResponse.ok) {
      throw new Error('No se pudo realizar el Check-In');
    }

    // Actualizar habitación a OCCUPIED
    await handleStatusChange(room._id, 'OCCUPIED');

    alert(
      `Check-In realizado correctamente para ${booking.guestName}.`
    );

    await fetchRooms();
  } catch (err) {
    console.error('Error realizando Check-In:', err);
    alert('No se pudo realizar el Check-In.');
  }
};

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
      alert(
        'No se encontró una reserva confirmada para esta habitación.'
      );
      return;
    }

    const confirmed = window.confirm(
      `¿Deseas cancelar la reserva de ${booking.guestName}?`
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch(
      `http://127.0.0.1:5000/api/bookings/${booking._id}/cancel`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          executedBy: 'Recepción',
          role: 'RECEPTIONIST'
        })
      }
    );

    if (!response.ok) {
      throw new Error('No se pudo cancelar la reserva');
    }

    alert(
      `Reserva de ${booking.guestName} cancelada correctamente.`
    );

    await fetchRooms();
  } catch (err) {
    console.error('Error cancelando reserva:', err);
    alert('No se pudo cancelar la reserva.');
  }
};
  // ======================================================
// CHECK-OUT
// ======================================================

const handleCheckOut = async (room) => {
  try {
    // Buscar las reservas de esta habitación
    const bookingsResponse = await fetch(
      'http://127.0.0.1:5000/api/bookings'
    );

    if (!bookingsResponse.ok) {
      throw new Error('No se pudieron obtener las reservas');
    }

    const bookings = await bookingsResponse.json();

    // Buscar la reserva que está actualmente CHECKED_IN
    const booking = bookings.find(
      (item) =>
        (item.roomId?._id || item.roomId) === room._id &&
        item.status === 'CHECKED_IN'
    );

    if (!booking) {
      alert(
        'No se encontró una reserva activa para esta habitación.'
      );
      return;
    }

    // Actualizar la reserva
    const response = await fetch(
      `http://127.0.0.1:5000/api/bookings/${booking._id}/check-out`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          executedBy: 'Recepción',
          role: 'RECEPTIONIST'
        })
      }
    );

    if (!response.ok) {
      throw new Error('No se pudo realizar el Check-Out');
    }

    alert(
      `Check-Out realizado correctamente para ${booking.guestName}.`
    );

    await fetchRooms();
  } catch (err) {
    console.error('Error realizando Check-Out:', err);

    alert('No se pudo realizar el Check-Out.');
  }
};

  // ======================================================
  // CONSUMO ADICIONAL
  // ======================================================

  const handleAddConsumption = async (e) => {
    e.preventDefault();

    if (!itemDescription || !itemPrice) {
      return;
    }

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

  // ======================================================
  // INTERFAZ
  // ======================================================

  return (
    <div
      style={{
        padding: '30px',
        backgroundColor: '#121212',
        color: '#fff',
        minHeight: '100vh'
      }}
    >
      <header
        style={{
          textAlign: 'center',
          marginBottom: '30px',
          borderBottom: '1px solid #333',
          paddingBottom: '15px'
        }}
      >
        <h1>🛎️ Panel Principal de Recepción & Control</h1>

        <p style={{ color: '#aaa' }}>
          Gestión de huéspedes, consumos extra, estados y Check-In / Check-Out
        </p>
      </header>

      {loading ? (
        <p
          style={{
            textAlign: 'center',
            color: '#888'
          }}
        >
          Cargando habitaciones desde la base de datos...
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}
        >
          {rooms.map((room) => {
            const statusInfo =
              STATUS_MAP[room.status] || {
                label: room.status,
                color: '#fff',
                bg: '#333'
              };

            const price =
              room.price || room.pricePerNight || 0;

            return (
              <div
                key={room._id || room.id}
                style={{
                  backgroundColor: '#1e1e1e',
                  padding: '20px',
                  borderRadius: '12px',
                  border: `2px solid ${statusInfo.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}
                  >
                    <h3 style={{ margin: 0 }}>
                      Habitación {room.number}
                    </h3>

                    <span
                      style={{
                        fontSize: '0.8rem',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: statusInfo.bg,
                        color: statusInfo.color,
                        fontWeight: 'bold'
                      }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <p
                    style={{
                      color: '#aaa',
                      margin: '4px 0'
                    }}
                  >
                    Tipo: <strong>{room.type}</strong>
                  </p>

                  <p
                    style={{
                      color: '#aaa',
                      margin: '4px 0 15px 0'
                    }}
                  >
                    Tarifa:{' '}
                    <strong>
                      ${price.toLocaleString('es-CO')} / noche
                    </strong>
                  </p>

                  {/* Cambio manual de estado */}
                  <div style={{ marginBottom: '15px' }}>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        color: '#888',
                        display: 'block',
                        marginBottom: '4px'
                      }}
                    >
                      Cambiar Estado Manual:
                    </label>

                    <select
                      value={room.status}
                      onChange={(e) =>
                        handleStatusChange(
                          room._id || room.id,
                          e.target.value
                        )
                      }
                      style={{
                        width: '100%',
                        padding: '6px',
                        backgroundColor: '#2d2d2d',
                        color: '#fff',
                        border: '1px solid #444',
                        borderRadius: '4px'
                      }}
                    >
                      <option value="AVAILABLE">
                        Disponible
                      </option>

                      <option value="OCCUPIED">
                        Ocupada
                      </option>

                      <option value="CLEANING">
                        En Aseo
                      </option>

                      <option value="RESERVED">
                        Reservada
                      </option>

                      <option value="OUT_OF_SERVICE">
                        Mantenimiento
                      </option>
                    </select>
                  </div>
                </div>

                {/* BOTONES */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  {/* CREAR RESERVA */}
                  {room.status === 'AVAILABLE' && (
                    <button
                      onClick={() => {
                        console.log('Habitación seleccionada:', room);
                        setSelectedRoom(room);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#22c55e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      📅 Crear Reserva
                    </button>
                  )}

                  {/* CHECK-IN */}
                  {room.status === 'RESERVED' && (
                    <>  

                      <button
                        onClick={() => handleCheckIn(room)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: '#3b82f6',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        🔑 Registrar Check-In
                      </button>

                       <button
                        onClick={() => handleCancelBooking(room)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          marginTop: '8px'
                        }}
                      >
                        ❌ Cancelar Reserva
                      </button>
                   </>
                  )}

                  {/* HABITACIÓN OCUPADA */}
                  {room.status === 'OCCUPIED' && (
                    <>
                      <button
                        onClick={() =>
                          setConsumptionModal(room)
                        }
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: '#eab308',
                          color: '#000',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        🍷 Cargar Consumo Adicional
                      </button>

                      <button
                        onClick={() => handleCheckOut(room)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: '#3b82f6',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        🚪 Registrar Check-Out
                      </button>
                    </>
                  )}

                  {/* HABITACIÓN EN ASEO */}
                  {room.status === 'CLEANING' && (
                    <button
                      onClick={() =>
                        handleStatusChange(
                          room._id || room.id,
                          'AVAILABLE'
                        )
                      }
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#22c55e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      🧹 Aseo Finalizado
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE RESERVA */}
      {selectedRoom && (
        <BookingModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onSaveBooking={fetchRooms}
        />
      )}

      {/* MODAL DE CONSUMOS */}
      {consumptionModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000    
          }}
        >
          <div
            style={{
              backgroundColor: '#1e1e1e',
              padding: '24px',
              borderRadius: '12px',
              width: '380px',
              border: '1px solid #444'
            }}
          >
            <h3>
              🍷 Agregar Consumo - Hab.{' '}
              {consumptionModal.number}
            </h3>

            <form
              onSubmit={handleAddConsumption}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginTop: '15px'
              }}
            >
              <input
                type="text"
                placeholder="Descripción (Ej. Servicio Minibar / Cena)"
                value={itemDescription}
                onChange={(e) =>
                  setItemDescription(e.target.value)
                }
                style={{
                  padding: '8px',
                  backgroundColor: '#2d2d2d',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: '4px'
                }}
                required
              />

              <input
                type="number"
                placeholder="Valor $"
                value={itemPrice}
                onChange={(e) =>
                  setItemPrice(e.target.value)
                }
                style={{
                  padding: '8px',
                  backgroundColor: '#2d2d2d',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: '4px'
                }}
                required
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  marginTop: '10px'
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setConsumptionModal(null)
                  }
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#eab308',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Guardar Consumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}