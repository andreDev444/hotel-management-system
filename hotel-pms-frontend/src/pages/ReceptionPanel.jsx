import React, { useState, useEffect } from 'react';
import BookingModal from '../components/BookingModal.jsx';

const STATUS_MAP = {
  AVAILABLE: { label: '🟢 Disponible', color: '#22c55e', bg: '#14532d' },
  CLEANING: { label: '🟠 En Aseo', color: '#f97316', bg: '#7c2d12' },
  OCCUPIED: { label: '🔵 Ocupada', color: '#3b82f6', bg: '#1e3a8a' },
  RESERVED: { label: '🟡 Reservada', color: '#eab308', bg: '#713f12' },
  OUT_OF_SERVICE: { label: '🔴 Mantenimiento', color: '#ef4444', bg: '#7f1d1d' }
};

export default function ReceptionPanel() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para gestión de Consumos Adicionales
  const [consumptionModal, setConsumptionModal] = useState(null);
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/rooms');
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error("Error al cargar habitaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cambio directo de estado manual de habitación
  const handleStatusChange = async (roomId, newStatus) => {
    try {
      await fetch(`http://127.0.0.1:5000/api/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          user: 'Recepción',
          role: 'RECEPTIONIST'
        })
      });
      fetchRooms();
    } catch (err) {
      console.error("Error cambiando estado:", err);
    }
  };

  // Agregar Consumo Adicional
  const handleAddConsumption = async (e) => {
    e.preventDefault();
    if (!itemDescription || !itemPrice) return;

    alert(`Consumo de "${itemDescription}" por $${Number(itemPrice).toLocaleString('es-CO')} cargado con éxito a la habitación ${consumptionModal.number}.`);
    setItemDescription('');
    setItemPrice('');
    setConsumptionModal(null);
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#121212', color: '#fff', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
        <h1>🛎️ Panel Principal de Recepción & Control</h1>
        <p style={{ color: '#aaa' }}>Gestión de huéspedes, consumos extra, estados y Check-In / Check-Out</p>
      </header>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#888' }}>Cargando habitaciones desde la base de datos...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {rooms.map(room => {
            const statusInfo = STATUS_MAP[room.status] || { label: room.status, color: '#fff', bg: '#333' };
            const price = room.price || room.pricePerNight || 0;

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
                  justify: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0 }}>Habitación {room.number}</h3>
                    <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px', backgroundColor: statusInfo.bg, color: statusInfo.color, fontWeight: 'bold' }}>
                      {statusInfo.label}
                    </span>
                  </div>
                  
                  <p style={{ color: '#aaa', margin: '4px 0' }}>Tipo: <strong>{room.type}</strong></p>
                  <p style={{ color: '#aaa', margin: '4px 0 15px 0' }}>Tarifa: <strong>${price.toLocaleString('es-CO')} / noche</strong></p>
                  
                  {/* Selector rápido de Cambio de Estado */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>Cambiar Estado Manual:</label>
                    <select 
                      value={room.status} 
                      onChange={(e) => handleStatusChange(room._id || room.id, e.target.value)}
                      style={{ width: '100%', padding: '6px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                    >
                      <option value="AVAILABLE">Disponible</option>
                      <option value="OCCUPIED">Ocupada</option>
                      <option value="CLEANING">En Aseo</option>
                      <option value="RESERVED">Reservada</option>
                      <option value="OUT_OF_SERVICE">Mantenimiento</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {room.status === 'AVAILABLE' && (
                    <button 
                      onClick={() => setSelectedRoom(room)} 
                      style={{ width: '100%', padding: '10px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      🔑 Registrar Check-In
                    </button>
                  )}

                  {room.status === 'OCCUPIED' && (
                    <>
                      <button 
                        onClick={() => setConsumptionModal(room)} 
                        style={{ width: '100%', padding: '8px', backgroundColor: '#eab308', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        🍷 Cargar Consumo Adicional
                      </button>
                      <button 
                        onClick={() => handleStatusChange(room._id || room.id, 'CLEANING')} 
                        style={{ width: '100%', padding: '8px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        🚪 Registrar Check-Out
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Check-In */}
      {selectedRoom && (
        <BookingModal 
          room={selectedRoom} 
          onClose={() => setSelectedRoom(null)} 
          onSaveBooking={fetchRooms} 
        />
      )}

      {/* Modal de Consumos Adicionales */}
      {consumptionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#1e1e1e', padding: '24px', borderRadius: '12px', width: '380px', border: '1px solid #444' }}>
            <h3>🍷 Agregar Consumo - Hab. {consumptionModal.number}</h3>
            <form onSubmit={handleAddConsumption} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <input 
                type="text" 
                placeholder="Descripción (Ej. Servicio Minibar / Cena)" 
                value={itemDescription} 
                onChange={(e) => setItemDescription(e.target.value)}
                style={{ padding: '8px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #555', borderRadius: '4px' }}
                required 
              />
              <input 
                type="number" 
                placeholder="Valor $" 
                value={itemPrice} 
                onChange={(e) => setItemPrice(e.target.value)}
                style={{ padding: '8px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #555', borderRadius: '4px' }}
                required 
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setConsumptionModal(null)} style={{ padding: '8px 12px', backgroundColor: '#444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 12px', backgroundColor: '#eab308', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar Consumo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

