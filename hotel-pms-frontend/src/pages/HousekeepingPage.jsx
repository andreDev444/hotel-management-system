import { useCallback, useEffect, useState } from 'react';
import Sidebar, {
  housekeepingMenuItems
} from '../components/Sidebar.jsx';
import './ReceptionPages.css';
import './Housekeeping.css';

const API_URL = 'http://localhost:5000/api/rooms';

const STATUS_MAP = {
  AVAILABLE: { label: 'Disponible', className: 'available' },
  CLEANING: { label: 'En aseo', className: 'cleaning' },
  OCCUPIED: { label: 'Ocupada', className: 'occupied' },
  RESERVED: { label: 'Reservada', className: 'reserved' },
  OUT_OF_SERVICE: {
    label: 'Fuera de servicio',
    className: 'out-of-service'
  }
};

export default function HousekeepingPage() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [damageReason, setDamageReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error('No se pudieron cargar las habitaciones.');
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Formato de respuesta inesperado.');
      }

      setRooms(data);
    } catch (err) {
      console.error('Error al cargar habitaciones:', err);
      setError(
        'No fue posible cargar las habitaciones. Verifica que el backend esté funcionando.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const changeStatus = async (roomId, status, reason = '') => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        `${API_URL}/${roomId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status,
            user: 'Personal de aseo',
            role: 'HOUSEKEEPING',
            reason
          })
        }
      );

      if (!response.ok) {
        throw new Error('No se pudo actualizar la habitación.');
      }

      setSelectedRoom(null);
      setDamageReason('');

      setMessage(
        status === 'OUT_OF_SERVICE'
          ? 'Se envió la solicitud de reporte de daño.'
          : 'El estado de la habitación se actualizó correctamente.'
      );

      await fetchRooms();
    } catch (err) {
      console.error('Error al actualizar habitación:', err);
      setError('No se pudo guardar el cambio. Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

      const handleDamageSubmit = async (event, roomId) => {
      event.preventDefault();

      const description = damageReason.trim();

      if (!description) {
        setError('Escribe una descripción del daño o la falla.');
        return;
      }

      setSaving(true);
      setError('');
      setMessage('');

      try {
        const response = await fetch('http://localhost:5000/api/incidents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            roomId,
            description,
            reportedBy: 'Personal de aseo',
            role: 'HOUSEKEEPING',
            priority: 'MEDIUM'
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'No se pudo registrar la incidencia.'
          );
        }

        setMessage('Incidencia registrada correctamente.');
        setDamageReason('');
        setSelectedRoom(null);

        await fetchRooms();
      } catch (err) {
        setError(err.message || 'Error al registrar la incidencia.');
      } finally {
        setSaving(false);
      }
    };

  const pendingCount = rooms.filter(
    (room) => room.status === 'CLEANING'
  ).length;

  const availableCount = rooms.filter(
    (room) => room.status === 'AVAILABLE'
  ).length;

  const damagedCount = rooms.filter(
    (room) => room.status === 'OUT_OF_SERVICE'
  ).length;

  return (
    <div className="pms-layout housekeeping-layout">
      <Sidebar
        items={housekeepingMenuItems}
        roleLabel="Personal de aseo"
        subtitle="Panel de trabajo"
      />

      <main className="pms-main">
        <div className="housekeeping-content">
          <header className="page-header housekeeping-header">
            <div>
              <p className="page-eyebrow">
                OPERACIONES DEL HOTEL
              </p>
              <h1 className="page-title">Personal de aseo</h1>
              <p className="page-description">
                Gestiona las habitaciones y registra las novedades
                encontradas durante el turno.
              </p>
            </div>

            <button
              className="page-button page-button-secondary"
              type="button"
              onClick={fetchRooms}
              disabled={loading || saving}
            >
              ↻ Actualizar
            </button>
          </header>

          {error && (
            <div className="hk-alert hk-alert-error" role="alert">
              {error}
            </div>
          )}

          {message && (
            <div className="hk-alert hk-alert-success" role="status">
              {message}
            </div>
          )}

          <section className="hk-summary">
            <article className="hk-summary-card">
              <span className="hk-summary-label">
                Pendientes de aseo
              </span>
              <strong>{loading ? '—' : pendingCount}</strong>
              <span className="hk-summary-detail">
                Habitaciones por atender
              </span>
            </article>

            <article className="hk-summary-card">
              <span className="hk-summary-label">Disponibles</span>
              <strong>{loading ? '—' : availableCount}</strong>
              <span className="hk-summary-detail">
                Estado actual registrado
              </span>
            </article>

            <article className="hk-summary-card">
              <span className="hk-summary-label">Fuera de servicio</span>
              <strong>{loading ? '—' : damagedCount}</strong>
              <span className="hk-summary-detail">
                Requieren seguimiento
              </span>
            </article>
          </section>

          <section className="hk-section">
            <div className="hk-section-heading">
              <div>
                <h2>Habitaciones</h2>
                <p>Consulta el estado y registra las novedades.</p>
              </div>

              {!loading && (
                <span className="hk-room-count">
                  {rooms.length} habitaciones
                </span>
              )}
            </div>

            {loading ? (
              <div className="empty-state">
                Cargando habitaciones...
              </div>
            ) : rooms.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">▦</div>
                <h3>Sin habitaciones registradas</h3>
                <p>
                  Cuando existan habitaciones en el sistema,
                  aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="hk-room-grid">
                {rooms.map((room) => {
                  const statusInfo = STATUS_MAP[room.status] || {
                    label: room.status || 'Sin estado',
                    className: 'unknown'
                  };

                  const isSelected = selectedRoom === room._id;

                  return (
                    <article className="hk-room-card" key={room._id}>
                      <div className="hk-room-top">
                        <div>
                          <span className="hk-room-number-label">
                            HABITACIÓN
                          </span>
                          <h3>{room.number}</h3>
                        </div>

                        <span
                          className={`hk-status hk-status-${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="hk-room-details">
                        <span>Tipo de habitación</span>
                        <strong>
                          {room.type || 'No especificado'}
                        </strong>
                      </div>

                      {room.status === 'CLEANING' && (
                        <button
                          className="page-button card-action"
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            changeStatus(room._id, 'AVAILABLE')
                          }
                        >
                          {saving
                            ? 'Guardando...'
                            : '✓ Marcar como limpia'}
                        </button>
                      )}

                      {room.status === 'OUT_OF_SERVICE' && (
                        <p className="hk-room-note">
                          Esta habitación está fuera de servicio.
                          Consulta con recepción o mantenimiento
                          antes de cambiar su estado.
                        </p>
                      )}

                      {isSelected ? (
                        <form
                          className="hk-report-form"
                          onSubmit={(event) =>
                            handleDamageSubmit(event, room._id)
                          }
                        >
                          <label htmlFor={`damage-${room._id}`}>
                            Describe el daño o la falla
                          </label>

                          <textarea
                            id={`damage-${room._id}`}
                            className="page-input"
                            value={damageReason}
                            onChange={(event) =>
                              setDamageReason(event.target.value)
                            }
                            placeholder="Ej. Fuga de agua en el baño..."
                            rows={3}
                            required
                          />

                          <button
                            className="page-button page-button-danger"
                            type="submit"
                            disabled={saving}
                          >
                            {saving ? 'Enviando...' : 'Enviar reporte'}
                          </button>

                          <button
                            className="page-button page-button-secondary"
                            type="button"
                            disabled={saving}
                            onClick={() => {
                              setSelectedRoom(null);
                              setDamageReason('');
                              setError('');
                            }}
                          >
                            Cancelar
                          </button>
                        </form>
                      ) : (
                        <button
                          className="page-button page-button-secondary"
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            setSelectedRoom(room._id);
                            setDamageReason('');
                            setError('');
                            setMessage('');
                          }}
                        >
                          ⚠ Reportar daño o falla
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
