import { useState } from 'react';
import { initialRooms } from './data/roomsData';
import RoomCard from './components/RoomCard';
import Navbar from './components/Navbar';
import BookingModal from './components/BookingModal';
import CheckoutModal from './components/CheckoutModal';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState(initialRooms);
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  
  // Modales
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [selectedBookingForCheckout, setSelectedBookingForCheckout] = useState(null);

  const handleStatusChange = (roomId, newStatus) => {
    setRooms(prevRooms => 
      prevRooms.map(room => room.id === roomId ? { ...room, status: newStatus } : room)
    );
  };

  const handleSaveBooking = (newBooking) => {
    setBookings(prev => [...prev, newBooking]);
    handleStatusChange(newBooking.roomId, 'RESERVED');
    alert(`¡Reserva ${newBooking.bookingCode} creada exitosamente!`);
  };

  // Acción: Realizar Check-In
  const handleCheckIn = (bookingCode) => {
    setBookings(prev => prev.map(b => {
      if (b.bookingCode === bookingCode) {
        handleStatusChange(b.roomId, 'OCCUPIED');
        return { ...b, status: 'CHECKED_IN' };
      }
      return b;
    }));
    alert(`Check-in realizado para la reserva ${bookingCode}. Habitación Ocupada.`);
  };

  // Acción: Finalizar Check-Out
  const handleCompleteCheckout = (booking, totalPaid, paymentMethod, services) => {
    setBookings(prev => prev.map(b => {
      if (b.bookingCode === booking.bookingCode) {
        return { ...b, status: 'CHECKED_OUT', totalPaid, paymentMethod, services };
      }
      return b;
    }));

    // Pasar habitación automáticamente a estado EN LIMPIEZA 
    handleStatusChange(booking.roomId, 'CLEANING');
    alert(`Check-Out finalizado. Total cobrado: $${totalPaid.toLocaleString()}. La habitación pasó a "En Limpieza".`);
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

      <h1>Dashboard - {user.role === 'HOUSEKEEPING' ? ' Módulo de Limpieza' : ' Control de Operaciones'}</h1>
      
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

      {/* Tabla de Reservas y Operaciones */}
      {bookings.length > 0 && user.role !== 'HOUSEKEEPING' && (
        <div style={{ marginTop: '40px', backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
          <h2> Gestión de Reservas y Check-In / Check-Out</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #444', color: '#aaa' }}>
                <th style={{ padding: '8px' }}>Código</th>
                <th style={{ padding: '8px' }}>Habitación</th>
                <th style={{ padding: '8px' }}>Huésped</th>
                <th style={{ padding: '8px' }}>Fechas</th>
                <th style={{ padding: '8px' }}>Estado</th>
                <th style={{ padding: '8px' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold', color: '#eab308' }}>{b.bookingCode}</td>
                  <td style={{ padding: '8px' }}>Hab. {b.roomNumber}</td>
                  <td style={{ padding: '8px' }}>{b.guestName}</td>
                  <td style={{ padding: '8px' }}>{b.checkIn} ➔ {b.checkOut}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                      backgroundColor: b.status === 'CONFIRMED' ? '#eab308' : b.status === 'CHECKED_IN' ? '#3b82f6' : '#22c55e',
                      color: b.status === 'CONFIRMED' ? '#000' : '#fff'
                    }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px' }}>
                    {b.status === 'CONFIRMED' && (
                      <button 
                        onClick={() => handleCheckIn(b.bookingCode)}
                        style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        🛎️ Check-In
                      </button>
                    )}

                    {b.status === 'CHECKED_IN' && (
                      <button 
                        onClick={() => setSelectedBookingForCheckout(b)}
                        style={{ padding: '6px 12px', backgroundColor: '#f97316', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        🚪 Check-Out & Cobrar
                      </button>
                    )}

                    {b.status === 'CHECKED_OUT' && (
                      <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Finalizado (${b.totalPaid?.toLocaleString()})</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      {selectedRoomForBooking && (
        <BookingModal 
          room={selectedRoomForBooking} 
          onClose={() => setSelectedRoomForBooking(null)}
          onSaveBooking={handleSaveBooking}
        />
      )}

      {selectedBookingForCheckout && (
        <CheckoutModal 
          booking={selectedBookingForCheckout}
          onClose={() => setSelectedBookingForCheckout(null)}
          onCompleteCheckout={handleCompleteCheckout}
        />
      )}
    </div>
  );
}

export default App;