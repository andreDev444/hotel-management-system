import { useState } from 'react';
import { initialRooms } from './data/roomsData';
import RoomCard from './components/RoomCard';
import Navbar from './components/Navbar';
import BookingModal from './components/BookingModal';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState(initialRooms);
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);

  const handleStatusChange = (roomId, newStatus) => {
    setRooms(prevRooms => 
      prevRooms.map(room => room.id === roomId ? { ...room, status: newStatus } : room)
    );
  };

  const handleSaveBooking = (newBooking) => {
    setBookings(prev => [...prev, newBooking]);
    // Cambiar automáticamente la habitación a estado "RESERVED"
    handleStatusChange(newBooking.roomId, 'RESERVED');
    alert(`¡Reserva ${newBooking.bookingCode} creada exitosamente!`);
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.includes(searchTerm) || room.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || room.status === selectedStatus;
    if (user.role === 'HOUSEKEEPING') {
      return matchesSearch && (room.status === 'CLEANING' || room.status === 'OUT_OF_SERVICE');
    }
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: '24px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#121212', minHeight: '100vh', color: '#fff' }}>
      <Navbar />

      <h1>Dashboard - {user.role === 'HOUSEKEEPING' ? '🧹 Módulo de Limpieza' : '🛎️ Control de Habitaciones'}</h1>
      
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
        {filteredRooms.map(room => (
          <RoomCard 
            key={room.id} 
            room={room} 
            onStatusChange={handleStatusChange} 
            onOpenBooking={(room) => setSelectedRoomForBooking(room)}
          />
        ))}
      </div>

      {/* Tabla de Reservas Confirmadas */}
      {bookings.length > 0 && user.role !== 'HOUSEKEEPING' && (
        <div style={{ marginTop: '40px', backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
          <h2>📅 Reservas Registradas ({bookings.length})</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #444', color: '#aaa' }}>
                <th style={{ padding: '8px' }}>Código</th>
                <th style={{ padding: '8px' }}>Habitación</th>
                <th style={{ padding: '8px' }}>Huésped</th>
                <th style={{ padding: '8px' }}>Documento</th>
                <th style={{ padding: '8px' }}>Fechas</th>
                <th style={{ padding: '8px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold', color: '#eab308' }}>{b.bookingCode}</td>
                  <td style={{ padding: '8px' }}>Hab. {b.roomNumber}</td>
                  <td style={{ padding: '8px' }}>{b.guestName}</td>
                  <td style={{ padding: '8px' }}>{b.document}</td>
                  <td style={{ padding: '8px' }}>{b.checkIn} ➔ {b.checkOut}</td>
                  <td style={{ padding: '8px' }}>🟡 {b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Reserva */}
      {selectedRoomForBooking && (
        <BookingModal 
          room={selectedRoomForBooking} 
          onClose={() => setSelectedRoomForBooking(null)}
          onSaveBooking={handleSaveBooking}
        />
      )}
    </div>
  );
}

export default App;