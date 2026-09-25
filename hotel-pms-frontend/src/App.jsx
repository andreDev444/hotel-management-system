import { useState } from 'react';
import { initialRooms } from './data/roomsData';
import RoomCard from './components/RoomCard';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState(initialRooms);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const handleStatusChange = (roomId, newStatus) => {
    setRooms(prevRooms => 
      prevRooms.map(room => 
        room.id === roomId ? { ...room, status: newStatus } : room
      )
    );
  };

  // Filtrado de habitaciones segun rol y filtros de búsqueda
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.includes(searchTerm) || room.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || room.status === selectedStatus;
    
    // Si el rol es Personal de Limpieza (HOUSEKEEPING), por defecto solo se enfoca en las que requieren limpieza o mantenimiento
    if (user.role === 'HOUSEKEEPING') {
      return matchesSearch && (room.status === 'CLEANING' || room.status === 'OUT_OF_SERVICE');
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: '24px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#121212', minHeight: '100vh', color: '#fff' }}>
      <Navbar />

      <h1>Dashboard - {user.role === 'HOUSEKEEPING' ? '🧹 Módulo de Limpieza' : '🛎️ Control de Habitaciones'}</h1>
      <p style={{ color: '#aaa', marginBottom: '20px' }}>
        {user.role === 'HOUSEKEEPING' 
          ? 'Habitaciones asignadas para revisión, aseo o mantenimiento.' 
          : 'Vista general del estado operativo de las habitaciones del hotel.'}
      </p>

      {/* Panel de Filtros solo visible para Admin, Recepción y Gerente */}
      {user.role !== 'HOUSEKEEPING' && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', backgroundColor: '#1e1e1e', padding: '16px', borderRadius: '8px' }}>
          <input 
            type="text"
            placeholder="🔍 Buscar por N° o Tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2d2d2d', color: '#fff' }}
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
      )}

      {/* Grid de habitaciones */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {filteredRooms.length > 0 ? (
          filteredRooms.map(room => (
            <RoomCard key={room.id} room={room} onStatusChange={handleStatusChange} />
          ))
        ) : (
          <p style={{ color: '#aaa' }}>No hay habitaciones que requieran atención con el rol actual.</p>
        )}
      </div>
    </div>
  );
}

export default App;