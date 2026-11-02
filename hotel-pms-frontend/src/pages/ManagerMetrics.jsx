
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar, {
  managementMenuItems
} from '../components/Sidebar.jsx';

import './ReceptionPages.css';
import './ManagerMetrics.css';

const API_URL = 'http://127.0.0.1:5000/api';

const formatMoney = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return 'No especificada';

  return new Date(value).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

async function getData(endpoint) {
  const response = await fetch(`${API_URL}/${endpoint}`);

  if (!response.ok) {
    throw new Error(`No se pudo consultar ${endpoint}.`);
  }

  return response.json();
}

export default function ManagerMetrics() {
  const location = useLocation();

  const isReports = location.pathname.endsWith('/reportes');

  // REPORTES
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportError, setReportError] = useState('');

  // INCIDENCIAS
  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [incidentError, setIncidentError] = useState('');
  const [incidentMessage, setIncidentMessage] = useState('');
  const [authorizingIncident, setAuthorizingIncident] = useState(null);

  // CONSULTAR REPORTES
  const fetchReports = async () => {
    setLoadingReports(true);
    setReportError('');

    try {
      const [roomsData, bookingsData, paymentsData] =
        await Promise.all([
          getData('rooms'),
          getData('bookings'),
          getData('payments')
        ]);

      if (
        !Array.isArray(roomsData) ||
        !Array.isArray(bookingsData) ||
        !Array.isArray(paymentsData)
      ) {
        throw new Error('El servidor devolvió información no válida.');
      }

      setRooms(roomsData);
      setBookings(bookingsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      setReportError(
        'No fue posible cargar los reportes. Verifica la conexión con el servidor.'
      );
    } finally {
      setLoadingReports(false);
    }
  };

  // CONSULTAR INCIDENCIAS
  const fetchIncidents = async () => {
    setLoadingIncidents(true);
    setIncidentError('');

    try {
      const data = await getData('incidents');

      if (!Array.isArray(data)) {
        throw new Error('La respuesta de incidencias no es válida.');
      }

      setIncidents(
        data.filter((incident) =>
          ['PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(
            incident.status
          )
        )
      );
    } catch (error) {
      console.error('Error cargando incidencias:', error);
      setIncidentError(
        'No fue posible cargar las incidencias reportadas.'
      );
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    if (isReports) {
      fetchReports();
    } else {
      fetchIncidents();
    }
  }, [isReports]);

  // CONFIRMAR REPARACIÓN
  const confirmRepair = async (incident) => {
    const notes = window.prompt(
      `Describe la reparación realizada en la habitación ${incident.roomNumber}:`
    );

    if (notes === null) return;

    if (!notes.trim()) {
      setIncidentError('Debes escribir una nota sobre la reparación.');
      return;
    }

    setIncidentError('');
    setIncidentMessage('');

    try {
      const response = await fetch(
        `${API_URL}/incidents/${incident._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'RESOLVED',
            resolutionNotes: notes.trim(),
            updatedBy: 'Gerencia',
            role: 'MANAGER'
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'No se pudo confirmar la reparación.'
        );
      }

      setIncidentMessage(
        `Reparación de la habitación ${incident.roomNumber} confirmada.`
      );

      await fetchIncidents();
    } catch (error) {
      setIncidentError(error.message);
    }
  };

  // AUTORIZAR RECUPERACIÓN
  const authorizeRecovery = async (incident) => {
    const confirmed = window.confirm(
      `¿Autorizas la recuperación de la habitación ${incident.roomNumber} para enviarla a aseo?`
    );

    if (!confirmed) return;

    setAuthorizingIncident(incident._id);
    setIncidentError('');
    setIncidentMessage('');

    try {
      const response = await fetch(
        `${API_URL}/incidents/${incident._id}/authorize-recovery`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            authorizedBy: 'Gerencia',
            role: 'MANAGER'
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'No se pudo autorizar la recuperación.'
        );
      }

      setIncidents((previous) =>
        previous.filter((item) => item._id !== incident._id)
      );

      setIncidentMessage(
        `Habitación ${incident.roomNumber} autorizada y enviada a aseo.`
      );
    } catch (error) {
      setIncidentError(error.message);
    } finally {
      setAuthorizingIncident(null);
    }
  };

  // INDICADORES DE OCUPACIÓN
  const totalRooms = rooms.length;

  const occupiedRooms = rooms.filter(
    (room) => room.status === 'OCCUPIED'
  ).length;

  const reservedRooms = rooms.filter(
    (room) => room.status === 'RESERVED'
  ).length;

  const availableRooms = rooms.filter(
    (room) => room.status === 'AVAILABLE'
  ).length;

  const cleaningRooms = rooms.filter(
    (room) => room.status === 'CLEANING'
  ).length;

  const maintenanceRooms = rooms.filter(
    (room) => room.status === 'OUT_OF_SERVICE'
  ).length;

  const occupancyPercentage = totalRooms
    ? Math.round((occupiedRooms / totalRooms) * 100)
    : 0;

  const committedPercentage = totalRooms
    ? Math.round(
        ((occupiedRooms + reservedRooms) / totalRooms) * 100
      )
    : 0;

  // INDICADORES DE RESERVAS
  const confirmedBookings = bookings.filter(
    (booking) => booking.status === 'CONFIRMED'
  ).length;

  const checkedInBookings = bookings.filter(
    (booking) => booking.status === 'CHECKED_IN'
  ).length;

  const checkedOutBookings = bookings.filter(
    (booking) => booking.status === 'CHECKED_OUT'
  ).length;

  const cancelledBookings = bookings.filter(
    (booking) => booking.status === 'CANCELLED'
  ).length;

  // INGRESOS REGISTRADOS EN PAGOS
  const totalRevenue = payments.reduce(
    (total, payment) => total + (Number(payment.amount) || 0),
    0
  );

  // GRÁFICA DE LOS ÚLTIMOS SEIS MESES
  const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));

    const year = date.getFullYear();
    const month = date.getMonth();

    const amount = payments
      .filter((payment) => {
        const paymentDate = new Date(
          payment.createdAt || payment.paymentDate
        );

        return (
          !Number.isNaN(paymentDate.getTime()) &&
          paymentDate.getFullYear() === year &&
          paymentDate.getMonth() === month
        );
      })
      .reduce(
        (total, payment) => total + (Number(payment.amount) || 0),
        0
      );

    return {
      label: date.toLocaleDateString('es-CO', {
        month: 'short'
      }),
      amount
    };
  });

  const maxRevenue = Math.max(
    ...monthlyRevenue.map((item) => item.amount),
    1
  );

  // INDICADORES DE INCIDENCIAS
  const pendingCount = incidents.filter(
    (incident) => incident.status === 'PENDING'
  ).length;

  const inProgressCount = incidents.filter(
    (incident) => incident.status === 'IN_PROGRESS'
  ).length;

  const resolvedCount = incidents.filter(
    (incident) => incident.status === 'RESOLVED'
  ).length;

  return (
    <div className="pms-layout">
      <Sidebar
        items={managementMenuItems}
        roleLabel="Gerencia"
        subtitle="Gestión hotelera"
      />

      <main className="pms-main">
        <div className="reception-content manager-content">

          <header className="page-header">
            <div>
              <p className="page-eyebrow">
                Grand Hotel · Gerencia
              </p>

              <h1 className="page-title">
                {isReports
                  ? 'Reportes y analítica'
                  : 'Incidencias y mantenimiento'}
              </h1>

              <p className="page-description">
                {isReports
                  ? 'Consulta los indicadores operativos y financieros del hotel para apoyar la toma de decisiones.'
                  : 'Supervisa las incidencias, coordina las reparaciones y autoriza la recuperación de las habitaciones.'}
              </p>
            </div>

            <button
              type="button"
              className="page-button page-button-secondary"
              onClick={isReports ? fetchReports : fetchIncidents}
              disabled={isReports ? loadingReports : loadingIncidents}
            >
              ↻ Actualizar
            </button>
          </header>

          {/* REPORTES Y ANALÍTICA */}
          {isReports ? (
            <section className="manager-reports">

              {reportError && (
                <div className="manager-alert manager-alert-error">
                  {reportError}
                </div>
              )}

              {loadingReports ? (
                <div className="empty-state">
                  <p>Cargando información del hotel...</p>
                </div>
              ) : (
                <>
                  <div className="manager-section-header">
                    <div>
                      <p className="page-eyebrow">
                        RESUMEN GENERAL
                      </p>
                      <h2 className="page-section-title">
                        Indicadores del hotel
                      </h2>
                    </div>
                  </div>

                  <div className="manager-report-grid">
                    <article className="manager-report-card">
                      <span className="manager-report-icon">▦</span>
                      <p>Habitaciones totales</p>
                      <strong>{totalRooms}</strong>
                      <small>Inventario del hotel</small>
                    </article>

                    <article className="manager-report-card">
                      <span className="manager-report-icon">◉</span>
                      <p>Ocupación actual</p>
                      <strong>{occupancyPercentage}%</strong>
                      <small>{occupiedRooms} habitaciones ocupadas</small>
                    </article>

                    <article className="manager-report-card">
                      <span className="manager-report-icon">$</span>
                      <p>Ingresos registrados</p>
                      <strong>{formatMoney(totalRevenue)}</strong>
                      <small>Pagos registrados en el sistema</small>
                    </article>

                    <article className="manager-report-card">
                      <span className="manager-report-icon">▤</span>
                      <p>Total de reservas</p>
                      <strong>{bookings.length}</strong>
                      <small>Historial de reservas</small>
                    </article>
                  </div>

                  {/* OCUPACIÓN */}
                  <section className="manager-report-section">
                    <div className="manager-section-header">
                      <div>
                        <p className="page-eyebrow">
                          ESTADO DE HABITACIONES
                        </p>
                        <h2 className="page-section-title">
                          Ocupación del hotel
                        </h2>
                      </div>
                    </div>

                    <article className="manager-chart-card">
                      <div className="manager-occupancy-heading">
                        <div>
                          <strong>{occupancyPercentage}%</strong>
                          <p>Ocupación efectiva</p>
                        </div>
                        <div className="manager-occupancy-secondary">
                          <strong>{committedPercentage}%</strong>
                          <p>Ocupadas + reservadas</p>
                        </div>
                      </div>

                      <div className="manager-progress-track">
                        <div
                          className="manager-progress-fill"
                          style={{
                            width: `${occupancyPercentage}%`
                          }}
                        />
                      </div>

                      <div className="manager-room-stats">
                        <div>
                          <span className="manager-dot dot-occupied" />
                          <span>Ocupadas</span>
                          <strong>{occupiedRooms}</strong>
                        </div>
                        <div>
                          <span className="manager-dot dot-reserved" />
                          <span>Reservadas</span>
                          <strong>{reservedRooms}</strong>
                        </div>
                        <div>
                          <span className="manager-dot dot-available" />
                          <span>Disponibles</span>
                          <strong>{availableRooms}</strong>
                        </div>
                        <div>
                          <span className="manager-dot dot-cleaning" />
                          <span>En aseo</span>
                          <strong>{cleaningRooms}</strong>
                        </div>
                        <div>
                          <span className="manager-dot dot-maintenance" />
                          <span>Mantenimiento</span>
                          <strong>{maintenanceRooms}</strong>
                        </div>
                      </div>
                    </article>
                  </section>

                  {/* INGRESOS */}
                  <section className="manager-report-section">
                    <div className="manager-section-header">
                      <div>
                        <p className="page-eyebrow">
                          INFORMACIÓN FINANCIERA
                        </p>
                        <h2 className="page-section-title">
                          Ingresos de los últimos seis meses
                        </h2>
                        <p className="page-description">
                          Valores basados en los pagos registrados.
                        </p>
                      </div>
                    </div>

                    <article className="manager-chart-card">
                      <div className="manager-revenue-chart">
                        {monthlyRevenue.map((item, index) => (
                          <div
                            className="manager-bar-column"
                            key={`${item.label}-${index}`}
                          >
                            <strong>
                              {formatMoney(item.amount)}
                            </strong>

                            <div className="manager-bar-track">
                              <div
                                className="manager-bar"
                                style={{
                                  height: `${Math.max(
                                    (item.amount / maxRevenue) * 100,
                                    item.amount > 0 ? 4 : 0
                                  )}%`
                                }}
                              />
                            </div>

                            <span>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </article>
                  </section>

                  {/* RESERVAS */}
                  <section className="manager-report-section">
                    <div className="manager-section-header">
                      <div>
                        <p className="page-eyebrow">
                          ACTIVIDAD COMERCIAL
                        </p>
                        <h2 className="page-section-title">
                          Estado de las reservas
                        </h2>
                      </div>
                    </div>

                    <div className="manager-booking-grid">
                      <article className="manager-booking-card">
                        <span>Confirmadas</span>
                        <strong>{confirmedBookings}</strong>
                      </article>

                      <article className="manager-booking-card">
                        <span>Huéspedes alojados</span>
                        <strong>{checkedInBookings}</strong>
                      </article>

                      <article className="manager-booking-card">
                        <span>Finalizadas</span>
                        <strong>{checkedOutBookings}</strong>
                      </article>

                      <article className="manager-booking-card">
                        <span>Canceladas</span>
                        <strong>{cancelledBookings}</strong>
                      </article>
                    </div>
                  </section>
                </>
              )}
            </section>
          ) : (

            /* INCIDENCIAS Y MANTENIMIENTO */
            <section className="manager-maintenance">

              <div className="manager-summary">
                <article className="manager-summary-card">
                  <span className="manager-summary-icon">!</span>
                  <div>
                    <p>Pendientes</p>
                    <strong>{pendingCount}</strong>
                  </div>
                </article>

                <article className="manager-summary-card">
                  <span className="manager-summary-icon">⚒</span>
                  <div>
                    <p>En reparación</p>
                    <strong>{inProgressCount}</strong>
                  </div>
                </article>

                <article className="manager-summary-card">
                  <span className="manager-summary-icon">✓</span>
                  <div>
                    <p>Por enviar a aseo</p>
                    <strong>{resolvedCount}</strong>
                  </div>
                </article>
              </div>

              <div className="manager-section-header">
                <div>
                  <p className="page-eyebrow">
                    OPERACIONES DEL HOTEL
                  </p>
                  <h2 className="page-section-title">
                    Incidencias reportadas
                  </h2>
                  <p className="page-description">
                    Revisa los daños reportados, confirma las reparaciones
                    y autoriza el regreso de las habitaciones al proceso
                    de aseo.
                  </p>
                </div>

                <span className="manager-incident-count">
                  {incidents.length}{' '}
                  {incidents.length === 1
                    ? 'incidencia'
                    : 'incidencias'}
                </span>
              </div>

              {incidentError && (
                <div
                  className="manager-alert manager-alert-error"
                  role="alert"
                >
                  {incidentError}
                </div>
              )}

              {incidentMessage && (
                <div
                  className="manager-alert manager-alert-success"
                  role="status"
                >
                  {incidentMessage}
                </div>
              )}

              {loadingIncidents ? (
                <div className="empty-state">
                  <p>Cargando incidencias...</p>
                </div>
              ) : incidents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">✓</div>
                  <h3>Todo está al día</h3>
                  <p>
                    No hay incidencias activas que requieran atención.
                  </p>
                </div>
              ) : (
                <div className="manager-incident-grid">
                  {incidents.map((incident) => (
                    <article
                      className="page-card manager-incident-card"
                      key={incident._id}
                    >
                      <div className="manager-incident-header">
                        <div>
                          <p className="page-eyebrow">Habitación</p>
                          <h3 className="manager-room-number">
                            {incident.roomNumber}
                          </h3>
                        </div>

                        <span
                          className={`manager-status manager-status-${String(
                            incident.status
                          ).toLowerCase()}`}
                        >
                          {incident.status === 'PENDING'
                            ? 'Pendiente'
                            : incident.status === 'IN_PROGRESS'
                              ? 'En reparación'
                              : incident.status === 'RESOLVED'
                                ? 'Reparación confirmada'
                                : incident.status}
                        </span>
                      </div>

                      <div className="manager-incident-details">
                        <p>
                          <strong>Descripción</strong>
                          <span>
                            {incident.description || 'Sin descripción'}
                          </span>
                        </p>

                        <p>
                          <strong>Reportado por</strong>
                          <span>
                            {incident.reportedBy || 'No especificado'}
                          </span>
                        </p>

                        <p>
                          <strong>Prioridad</strong>
                          <span>
                            {incident.priority || 'No especificada'}
                          </span>
                        </p>

                        <p>
                          <strong>Fecha del reporte</strong>
                          <span>{formatDate(incident.createdAt)}</span>
                        </p>

                        {incident.resolutionNotes && (
                          <p>
                            <strong>Notas de reparación</strong>
                            <span>{incident.resolutionNotes}</span>
                          </p>
                        )}
                      </div>

                      <div className="manager-incident-actions">
                        {incident.status !== 'RESOLVED' && (
                          <button
                            type="button"
                            className="page-button"
                            onClick={() => confirmRepair(incident)}
                          >
                            Confirmar reparación
                          </button>
                        )}

                        {incident.status === 'RESOLVED' && (
                          <button
                            type="button"
                            className="page-button"
                            disabled={authorizingIncident !== null}
                            onClick={() => authorizeRecovery(incident)}
                          >
                            {authorizingIncident === incident._id
                              ? 'Autorizando...'
                              : 'Autorizar recuperación'}
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
