import { useState } from 'react';
import { initialRooms } from './data/roomsData';
import RoomCard from './components/RoomCard';

function App() {
  const [rooms, setRooms] = useState(initialRooms);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Actualizar estado de una habitación
  const handleStatusChange = (roomId, newStatus) => {
    setRooms(prevRooms => 
      prevRooms.map(room => 
        room.id === roomId ? { ...room, status: newStatus } : room
      )
    );
  };

  // Lógica de filtrado en tiempo real
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.includes(searchTerm) || room.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || room.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Métricas rápidas para el encabezado
  const total = rooms.length;
  const available = rooms.filter(r => r.status === 'AVAILABLE').length;
  const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;
  const cleaning = rooms.filter(r => r.status === 'CLEANING').length;

  return (
    <div style={{ padding: '32px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#121212', minHeight: '100vh', color: '#fff' }}>
      <h1> Hotel PMS - Control de Habitaciones</h1>
      
      {/*  Resumen Rápido de Estados */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={badgeStyle('#333')}>Total: {total}</div>
        <div style={badgeStyle('#22c55e')}>🟢 Disponibles: {available}</div>
        <div style={badgeStyle('#3b82f6')}>🔵 Ocupadas: {occupied}</div>
        <div style={badgeStyle('#f97316')}>🟠 En Limpieza: {cleaning}</div>
      </div>

      {/* 🔎 Panel de Búsqueda y Filtros */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', backgroundColor: '#1e1e1e', padding: '16px', borderRadius: '8px' }}>
        <input 
          type="text"
          placeholder="🔍 Buscar por N° o Tipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2d2d2d', color: '#fff', minWidth: '220px' }}
        />

        <select 
          value={selectedStatus} 
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2d2d2d', color: '#fff' }}
        >
          <option value="ALL">Todos los Estados</option>
          <option value="AVAILABLE">🟢 Disponibles</option>
          <option value="OCCUPIED">🔵 Ocupadas</option>
          <option value="RESERVED">🟡 Reservadas</option>
          <option value="CLEANING">🟠 En Limpieza</option>
          <option value="OUT_OF_SERVICE">🔴 Fuera de Servicio</option>
        </select>
      </div>

      {/* 🛏️ Rejilla de Habitaciones */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {filteredRooms.length > 0 ? (
          filteredRooms.map(room => (
            <RoomCard 
              key={room.id} 
              room={room} 
              onStatusChange={handleStatusChange} 
            />
          ))
        ) : (
          <p style={{ color: '#aaa' }}>No se encontraron habitaciones con los filtros aplicados.</p>
        )}
      </div>
    </div>
  );
}

const badgeStyle = (bgColor) => ({
  backgroundColor: bgColor,
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '0.85rem',
  fontWeight: 'bold'
});

export default App;