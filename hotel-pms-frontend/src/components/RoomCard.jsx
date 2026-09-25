import React from 'react';

const statusConfig = {
  AVAILABLE: { label: 'Disponible', color: '#22c55e', badge: '🟢' },
  OCCUPIED: { label: 'Ocupada', color: '#3b82f6', badge: '🔵' },
  RESERVED: { label: 'Reservada', color: '#eab308', badge: '🟡' },
  CLEANING: { label: 'En limpieza', color: '#f97316', badge: '🟠' },
  OUT_OF_SERVICE: { label: 'Fuera de servicio', color: '#ef4444', badge: '🔴' },
};

export default function RoomCard({ room, onStatusChange, onOpenBooking }) {
  const currentStatus = statusConfig[room.status] || statusConfig.AVAILABLE;

  return (
    <div style={{
      border: `2px solid ${currentStatus.color}`,
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: '#1a1a1a',
      color: '#fff',
      width: '220px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      justify: 'space-between'
    }}>
      <div>
        <h3>Habitación {room.number}</h3>
        <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#aaa' }}>
          {room.type} · Piso {room.floor}
        </p>
        <p style={{ fontWeight: 'bold', margin: '8px 0' }}>
          ${room.price.toLocaleString()} / noche
        </p>
        
        <div style={{
          backgroundColor: currentStatus.color,
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          display: 'inline-block',
          marginBottom: '12px'
        }}>
          {currentStatus.badge} {currentStatus.label}
        </div>
      </div>

      <div>
        {room.status === 'AVAILABLE' && onOpenBooking && (
          <button 
            onClick={() => onOpenBooking(room)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#eab308',
              color: '#000',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '4px',
              marginBottom: '8px',
              cursor: 'pointer'
            }}
          >
            📅 Crear Reserva
          </button>
        )}

        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>
          Cambiar Estado:
        </label>
        <select 
          value={room.status} 
          onChange={(e) => onStatusChange(room.id, e.target.value)}
          style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: '#2d2d2d', color: '#fff' }}
        >
          <option value="AVAILABLE">🟢 Disponible</option>
          <option value="OCCUPIED">🔵 Ocupada</option>
          <option value="RESERVED">🟡 Reservada</option>
          <option value="CLEANING">🟠 En Limpieza</option>
          <option value="OUT_OF_SERVICE">🔴 Fuera de Servicio</option>
        </select>
      </div>
    </div>
  );
}