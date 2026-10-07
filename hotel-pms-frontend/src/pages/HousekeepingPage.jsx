import React, { useState, useEffect } from 'react';

const STATUS_MAP = {
  AVAILABLE: { label: '🟢 Disponible', color: '#22c55e', bg: '#14532d' },
  CLEANING: { label: '🟠 En Aseo', color: '#f97316', bg: '#7c2d12' },
  OCCUPIED: { label: '🔵 Ocupada', color: '#3b82f6', bg: '#1e3a8a' },
  RESERVED: { label: '🟡 Reservada', color: '#eab308', bg: '#713f12' },
  OUT_OF_SERVICE: { label: '🔴 Fuera de Servicio', color: '#ef4444', bg: '#7f1d1d' }
};

export default function HousekeepingPage() {
  const [rooms, setRooms] = useState([]);
  const [damageReason, setDamageReason] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/rooms');
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error("Error al cargar habitaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (roomId, status, reason = '') => {
    try {
      await fetch(`http://localhost:5000/api/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          user: 'María Gómez', 
          role: 'HOUSEKEEPING', 
          reason 
        })
      });
      setDamageReason('');
      setSelectedRoom(null);
      fetchRooms();
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    }
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#121212', color: '#fff', minHeight: '100vh' }}>
      <header style={{ marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
        <h1>🧹 Módulo de Limpieza & Mantenimiento</h1>
        <p style={{ color: '#aaa' }}>Gestiona la disponibilidad de las habitaciones y reporta incidencias en tiempo real.</p>
      </header>

      {loading ? (
        <p style={{ color: '#888' }}>Cargando habitaciones desde MongoDB...</p>
      ) : rooms.length === 0 ? (
        <p style={{ color: '#888' }}>No hay habitaciones registradas.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {rooms.map(room => {
            const statusInfo = STATUS_MAP[room.status] || { label: room.status, color: '#fff', bg: '#333' };

            return (
              <div 
                key={room._id} 
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
                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Habitación {room.number}</h3>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      backgroundColor: statusInfo.bg, 
                      color: statusInfo.color,
                      fontWeight: 'bold'
                    }}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <p style={{ color: '#aaa', margin: '5px 0 15px 0' }}>Tipo: <strong>{room.type}</strong></p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {room.status === 'CLEANING' && (
                    <button 
                      onClick={() => changeStatus(room._id, 'AVAILABLE')} 
                      style={{ padding: '10px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ✨ Marcar como Limpia
                    </button>
                  )}

                  {selectedRoom === room._id ? (
                    <div style={{ backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        placeholder="Describa el daño o problema..." 
                        value={damageReason} 
                        onChange={e => setDamageReason(e.target.value)} 
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#1e1e1e', color: '#fff' }} 
                      />
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => changeStatus(room._id, 'OUT_OF_SERVICE', damageReason)} 
                          style={{ flex: 1, padding: '8px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Confirmar
                        </button>
                        <button 
                          onClick={() => setSelectedRoom(null)} 
                          style={{ padding: '8px', backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSelectedRoom(room._id)} 
                      style={{ padding: '8px', backgroundColor: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ⚠️ Reportar Daño / Falla
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}