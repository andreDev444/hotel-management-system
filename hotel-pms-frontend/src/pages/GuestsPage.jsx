import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import './ReceptionPages.css';

const API_URL = 'http://127.0.0.1:5000/api';

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

const formatDate = (value) => {
  if (!value) return 'No disponible';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'No disponible'
    : date.toLocaleDateString('es-CO');
};

export default function GuestsPage() {
  const [guests, setGuests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [guestBookings, setGuestBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
  });

  const fetchGuests = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const response = await fetch(`${API_URL}/guests`);

      if (!response.ok) {
        throw new Error('No se pudieron obtener los huéspedes.');
      }

      const data = await response.json();
      setGuests(data);
    } catch (error) {
      console.error('Error obteniendo huéspedes:', error);
      setErrorMessage(
        'No fue posible cargar los huéspedes. Comprueba que el servidor esté funcionando.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const filteredGuests = guests.filter((guest) => {
    const searchText = search.trim().toLowerCase();

    return [
      guest.name,
      guest.document,
      guest.email,
      guest.phone,
    ].some((value) =>
      String(value || '').toLowerCase().includes(searchText)
    );
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage('');

      const response = await fetch(`${API_URL}/guests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          executedBy: 'Recepción',
          role: 'RECEPTIONIST',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details ||
            data.error ||
            'No se pudo registrar el huésped.'
        );
      }

      window.alert('Huésped registrado correctamente.');

      setFormData({
        name: '',
        document: '',
        email: '',
        phone: '',
      });

      setShowForm(false);
      await fetchGuests();
    } catch (error) {
      console.error('Error registrando huésped:', error);
      window.alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleViewHistory = async (guest) => {
    try {
      const response = await fetch(`${API_URL}/bookings`);

      if (!response.ok) {
        throw new Error('No se pudieron obtener las reservas.');
      }

      const bookings = await response.json();

      const guestHistory = bookings.filter((booking) => {
        const guestId =
          booking.guestId?._id ?? booking.guestId;

        return String(guestId) === String(guest._id);
      });

      setGuestBookings(guestHistory);
      setSelectedGuest(guest);
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      window.alert('No se pudo cargar el historial del huésped.');
    }
  };

  const closeHistory = () => {
    setSelectedGuest(null);
    setGuestBookings([]);
  };

  return (
    <div className="pms-layout">
      <Sidebar />

      <main className="pms-main">
        <div className="reception-content">
          <header className="page-header">
            <div>
              <p className="page-eyebrow">Grand Hotel · Recepción</p>
              <h1 className="page-title">Gestión de Huéspedes</h1>
              <p className="page-description">
                Consulta los datos de tus huéspedes y revisa su
                historial de reservas.
              </p>
            </div>

            <button
              type="button"
              className="page-button"
              onClick={() => setShowForm((previous) => !previous)}
            >
              {showForm ? '✕ Cancelar' : '+ Nuevo huésped'}
            </button>
          </header>

          {showForm && (
            <section className="form-panel">
              <h2 className="form-title">Registrar nuevo huésped</h2>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="guest-name">Nombre completo</label>
                    <input
                      id="guest-name"
                      className="page-input"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nombre y apellidos"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="guest-document">Documento</label>
                    <input
                      id="guest-document"
                      className="page-input"
                      type="text"
                      name="document"
                      value={formData.document}
                      onChange={handleChange}
                      placeholder="Número de documento"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="guest-email">
                      Correo electrónico
                    </label>
                    <input
                      id="guest-email"
                      className="page-input"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="correo@ejemplo.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="guest-phone">Teléfono</label>
                    <input
                      id="guest-phone"
                      className="page-input"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Número de contacto"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="page-button page-button-secondary"
                    onClick={() => setShowForm(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="page-button"
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : 'Guardar huésped'}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section>
            <div className="page-toolbar">
              <div>
                <h2 className="page-section-title">
                  Huéspedes registrados
                </h2>
                <p className="page-count">
                  {filteredGuests.length}{' '}
                  {filteredGuests.length === 1
                    ? 'huésped encontrado'
                    : 'huéspedes encontrados'}
                </p>
              </div>

              <input
                className="page-search"
                type="search"
                placeholder="Buscar por nombre, documento o correo..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Buscar huéspedes"
              />
            </div>

            {loading ? (
              <div className="empty-state">
                <p>Cargando huéspedes...</p>
              </div>
            ) : errorMessage ? (
              <div className="empty-state">
                <h3>No se pudieron cargar los datos</h3>
                <p>{errorMessage}</p>
                <button
                  type="button"
                  className="page-button"
                  onClick={fetchGuests}
                  style={{ marginTop: 16 }}
                >
                  Reintentar
                </button>
              </div>
            ) : filteredGuests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">♙</div>
                <h3>
                  {search
                    ? 'No encontramos resultados'
                    : 'Aún no hay huéspedes'}
                </h3>
                <p>
                  {search
                    ? 'Prueba con otro nombre, documento o correo electrónico.'
                    : 'Cuando registres huéspedes, aparecerán aquí.'}
                </p>
              </div>
            ) : (
              <div className="page-grid">
                {filteredGuests.map((guest) => (
                  <article className="page-card" key={guest._id}>
                    <div className="guest-card-header">
                      <div className="guest-avatar" aria-hidden="true">
                        {(guest.name || 'H').charAt(0).toUpperCase()}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <h3 className="guest-name">{guest.name}</h3>
                        <p className="guest-document">
                          Documento: {guest.document || 'No registrado'}
                        </p>
                      </div>
                    </div>

                    <div className="page-detail">
                      <span className="page-detail-label">Correo</span>
                      <span className="page-detail-value">
                        {guest.email || 'No registrado'}
                      </span>
                    </div>

                    <div className="page-detail">
                      <span className="page-detail-label">Teléfono</span>
                      <span className="page-detail-value">
                        {guest.phone || 'No registrado'}
                      </span>
                    </div>

                    <div className="page-detail">
                      <span className="page-detail-label">Estado</span>
                      <span
                        className={`status-pill ${
                          guest.isActive ? 'status-active' : 'status-inactive'
                        }`}
                      >
                        {guest.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="page-button page-button-secondary card-action"
                      onClick={() => handleViewHistory(guest)}
                    >
                      Ver historial de reservas
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {selectedGuest && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeHistory();
          }}
        >
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-title"
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title" id="history-title">
                  Historial de reservas
                </h2>
                <p className="modal-subtitle">
                  {selectedGuest.name} · Documento:{' '}
                  {selectedGuest.document}
                </p>
              </div>

              <button
                type="button"
                className="page-button page-button-secondary"
                onClick={closeHistory}
                aria-label="Cerrar historial"
              >
                ✕
              </button>
            </div>

            {guestBookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">▤</div>
                <h3>Sin reservas registradas</h3>
                <p>
                  Este huésped todavía no tiene reservas asociadas.
                </p>
              </div>
            ) : (
              guestBookings.map((booking) => (
                <article className="history-card" key={booking._id}>
                  <h3>Reserva {booking.bookingCode || 'Sin código'}</h3>

                  <div className="page-detail">
                    <span className="page-detail-label">Habitación</span>
                    <span className="page-detail-value">
                      {booking.roomId?.number || 'No disponible'}
                    </span>
                  </div>

                  <div className="page-detail">
                    <span className="page-detail-label">Check-in</span>
                    <span className="page-detail-value">
                      {formatDate(booking.checkIn)}
                    </span>
                  </div>

                  <div className="page-detail">
                    <span className="page-detail-label">Check-out</span>
                    <span className="page-detail-value">
                      {formatDate(booking.checkOut)}
                    </span>
                  </div>

                  <div className="page-detail">
                    <span className="page-detail-label">Huéspedes</span>
                    <span className="page-detail-value">
                      {booking.guestsCount ?? 'No disponible'}
                    </span>
                  </div>

                  <div className="page-detail">
                    <span className="page-detail-label">Total</span>
                    <span className="page-detail-value">
                      {formatCurrency(booking.totalAmount)}
                    </span>
                  </div>

                  <div className="page-detail">
                    <span className="page-detail-label">Estado</span>
                    <span className="page-detail-value">
                      {booking.status || 'No disponible'}
                    </span>
                  </div>
                </article>
              ))
            )}

            <div className="form-actions">
              <button
                type="button"
                className="page-button"
                onClick={closeHistory}
              >
                Cerrar historial
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}