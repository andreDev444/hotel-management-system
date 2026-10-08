import { useEffect, useState } from 'react';

export default function GuestsPage() {
  const [guests, setGuests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [guestBookings, setGuestBookings] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: ''
  });

  const fetchGuests = async () => {
    try {
      const response = await fetch(
        'http://127.0.0.1:5000/api/guests'
      );

      if (!response.ok) {
        throw new Error('No se pudieron obtener los huéspedes');
      }

      const data = await response.json();
      setGuests(data);
    } catch (error) {
      console.error('Error obteniendo huéspedes:', error);
      alert('No se pudieron cargar los huéspedes.');
    }
  };
  
  const handleViewHistory = async (guest) => {
    try {
      const response = await fetch(
        'http://127.0.0.1:5000/api/bookings'
      );

      if (!response.ok) {
        throw new Error('No se pudieron obtener las reservas');
      }

      const bookings = await response.json();

      const guestHistory = bookings.filter(
        (booking) =>
          String(booking.guestId) === String(guest._id)
      );

      setSelectedGuest(guest);
      setGuestBookings(guestHistory);

    } catch (error) {
      console.error('Error obteniendo historial:', error);
      alert('No se pudo cargar el historial del huésped.');
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const filteredGuests = guests.filter((guest) => {
  const searchText = search.toLowerCase();

  return (
    guest.name.toLowerCase().includes(searchText) ||
    guest.document.toLowerCase().includes(searchText) ||
    guest.email.toLowerCase().includes(searchText)
  );
});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        'http://127.0.0.1:5000/api/guests',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            executedBy: 'Recepción',
            role: 'RECEPTIONIST'
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || 'No se pudo registrar el huésped');
      }

      alert('Huésped registrado correctamente.');

      setFormData({
        name: '',
        document: '',
        email: '',
        phone: ''
      });

      setShowForm(false);
      fetchGuests();

    } catch (error) {
      console.error('Error registrando huésped:', error);
      alert(error.message);
    }
  };

  return (
    <div
      style={{
        padding: '30px',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px'
        }}
      >
        <div>
          <h1 style={{ marginBottom: '5px' }}>
            👤 Gestión de Huéspedes
          </h1>

          <p style={{ color: '#666' }}>
            Registro y consulta de huéspedes del hotel
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '12px 20px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {showForm ? '✖ Cancelar' : '➕ Nuevo Huésped'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: '#f8fafc',
            padding: '25px',
            borderRadius: '10px',
            marginBottom: '30px',
            border: '1px solid #e2e8f0'
          }}
        >
          <h2>Registrar nuevo huésped</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px'
            }}
          >
            <div>
              <label>Nombre completo</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label>Documento</label>
              <input
                type="text"
                name="document"
                value={formData.document}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label>Correo electrónico</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label>Teléfono</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: '20px',
              padding: '12px 20px',
              backgroundColor: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            💾 Guardar Huésped
          </button>
        </form>
      )}

      <div>
        <div
            style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            gap: '15px'
            }}
        >
            <h2 style={{ margin: 0 }}>
            Huéspedes registrados
            </h2>

            <input
            type="text"
            placeholder="🔎 Buscar por nombre, documento o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
                width: '350px',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                outline: 'none'
            }}
            />
        </div>

        {guests.length === 0 ? (
          <p style={{ color: '#666' }}>
            No hay huéspedes registrados todavía.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}
          >
            {filteredGuests.map((guest) => (
              <div
                key={guest._id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '20px',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  👤 {guest.name}
                </h3>

                <p>
                  <strong>Documento:</strong> {guest.document}
                </p>

                <p>
                  <strong>Email:</strong> {guest.email}
                </p>

                <p>
                  <strong>Teléfono:</strong>{' '}
                  {guest.phone || 'No registrado'}
                </p>

                <p>
                  <strong>Estado:</strong>{' '}
                  {guest.isActive ? 'Activo' : 'Inactivo'}
                </p>
                <button
                  onClick={() => handleViewHistory(guest)}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  📋 Ver historial
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedGuest && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}
  >
    <div
      style={{
        backgroundColor: '#fff',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '80vh',
        overflowY: 'auto',
        borderRadius: '10px',
        padding: '25px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h2>
            📋 Historial de {selectedGuest.name}
          </h2>

          <p style={{ color: '#666' }}>
            Documento: {selectedGuest.document}
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedGuest(null);
            setGuestBookings([]);
          }}
          style={{
            backgroundColor: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 12px',
            cursor: 'pointer'
          }}
        >
          ✖
        </button>
      </div>

        {guestBookings.length === 0 ? (
          <p style={{ color: '#666' }}>
            Este huésped todavía no tiene reservas registradas.
          </p>
        ) : (
          <div>
            {guestBookings.map((booking) => (
              <div
                key={booking._id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '12px'
                }}
              >
                <h3>
                  🏨 Reserva {booking.bookingCode}
                </h3>

                <p>
                  <strong>Habitación:</strong>{' '}
                  {booking.roomId?.number || 'No disponible'}
                </p>

                <p>
                  <strong>Check-In:</strong>{' '}
                  {new Date(booking.checkIn).toLocaleDateString()}
                </p>

                <p>
                  <strong>Check-Out:</strong>{' '}
                  {new Date(booking.checkOut).toLocaleDateString()}
                </p>

                <p>
                  <strong>Huéspedes:</strong>{' '}
                  {booking.guestsCount}
                </p>

                <p>
                  <strong>Total:</strong>{' '}
                  ${Number(booking.totalAmount).toLocaleString('es-CO')}
                </p>

                <p>
                  <strong>Estado:</strong>{' '}
                  {booking.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )}

    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginTop: '6px',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  boxSizing: 'border-box'
};