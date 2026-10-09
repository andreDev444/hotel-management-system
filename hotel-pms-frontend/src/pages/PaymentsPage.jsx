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

export default function PaymentsPage() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [search, setSearch] = useState('');

  const fetchBookings = async () => {
    try {
      setFetching(true);
      setErrorMessage('');

      const response = await fetch(`${API_URL}/bookings`);

      if (!response.ok) {
        throw new Error('No se pudieron obtener las reservas.');
      }

      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error obteniendo reservas:', error);
      setErrorMessage(
        'No fue posible cargar las reservas. Comprueba que el servidor esté funcionando.'
      );
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getPendingAmount = (booking) => {
    const total = Number(booking.totalAmount || 0);
    const paid = Number(booking.totalPaid || 0);

    return Math.max(0, total - paid);
  };

  const filteredBookings = bookings.filter((booking) => {
    const searchText = search.trim().toLowerCase();

    return [
      booking.bookingCode,
      booking.guestName,
      booking.roomId?.number,
    ].some((value) =>
      String(value ?? '').toLowerCase().includes(searchText)
    );
  });

  const totalPending = bookings.reduce(
    (total, booking) => total + getPendingAmount(booking),
    0
  );

  const totalCollected = bookings.reduce(
    (total, booking) => total + Number(booking.totalPaid || 0),
    0
  );

  const openPaymentForm = (booking) => {
    setSelectedBooking(booking);
    setAmount('');
    setPaymentMethod('CASH');
  };

  const closePaymentForm = () => {
    if (loading) return;

    setSelectedBooking(null);
    setAmount('');
    setPaymentMethod('CASH');
  };

  const handleRegisterPayment = async (event) => {
    event.preventDefault();

    if (!selectedBooking) return;

    const paymentAmount = Number(amount);
    const pendingAmount = getPendingAmount(selectedBooking);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      window.alert('Ingresa un valor de pago válido.');
      return;
    }

    if (paymentAmount > pendingAmount) {
      window.alert(
        `El pago no puede superar el saldo pendiente de ${formatCurrency(
          pendingAmount
        )}.`
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: selectedBooking._id,
          amount: paymentAmount,
          paymentMethod,
          receivedBy: 'Recepción',
          role: 'RECEPTIONIST',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details ||
            data.error ||
            'No se pudo registrar el pago.'
        );
      }

      window.alert('Pago registrado correctamente.');

      setSelectedBooking(null);
      setAmount('');
      setPaymentMethod('CASH');

      await fetchBookings();
    } catch (error) {
      console.error('Error registrando pago:', error);
      window.alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pms-layout">
      <Sidebar />

      <main className="pms-main">
        <div className="reception-content">
          <header className="page-header">
            <div>
              <p className="page-eyebrow">Grand Hotel · Recepción</p>
              <h1 className="page-title">Gestión de Pagos</h1>
              <p className="page-description">
                Consulta los saldos de las reservas y registra los
                pagos de los huéspedes.
              </p>
            </div>

            <button
              type="button"
              className="page-button page-button-secondary"
              onClick={fetchBookings}
              disabled={fetching}
            >
              {fetching ? 'Actualizando...' : '↻ Actualizar'}
            </button>
          </header>

          <section className="payment-summary">
            <div className="payment-summary-item">
              <span className="payment-summary-label">
                Reservas registradas
              </span>
              <strong className="payment-summary-value">
                {bookings.length}
              </strong>
            </div>

            <div className="payment-summary-item">
              <span className="payment-summary-label">
                Total recaudado
              </span>
              <strong className="payment-summary-value">
                {formatCurrency(totalCollected)}
              </strong>
            </div>

            <div className="payment-summary-item">
              <span className="payment-summary-label">
                Saldo pendiente total
              </span>
              <strong className="payment-summary-value">
                {formatCurrency(totalPending)}
              </strong>
            </div>
          </section>

          <section>
            <div className="page-toolbar">
              <div>
                <h2 className="page-section-title">
                  Estado de las reservas
                </h2>
                <p className="page-count">
                  {filteredBookings.length}{' '}
                  {filteredBookings.length === 1
                    ? 'reserva encontrada'
                    : 'reservas encontradas'}
                </p>
              </div>

              <input
                className="page-search"
                type="search"
                placeholder="Buscar reserva, huésped o habitación..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Buscar reservas por código, huésped o habitación"
              />
            </div>

            {fetching ? (
              <div className="empty-state">
                <p>Cargando información de pagos...</p>
              </div>
            ) : errorMessage ? (
              <div className="empty-state">
                <h3>No se pudieron cargar los datos</h3>
                <p>{errorMessage}</p>
                <button
                  type="button"
                  className="page-button"
                  onClick={fetchBookings}
                  style={{ marginTop: 16 }}
                >
                  Reintentar
                </button>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">＄</div>
                <h3>
                  {search
                    ? 'No encontramos reservas'
                    : 'Aún no hay reservas'}
                </h3>
                <p>
                  {search
                    ? 'Prueba con otro código, nombre o número de habitación.'
                    : 'Cuando existan reservas, su información de pagos aparecerá aquí.'}
                </p>
              </div>
            ) : (
              <div className="page-grid">
                {filteredBookings.map((booking) => {
                  const pendingAmount = getPendingAmount(booking);
                  const isPaid = pendingAmount === 0;

                  return (
                    <article className="page-card" key={booking._id}>
                      <div className="guest-card-header">
                        <div className="guest-avatar" aria-hidden="true">
                          ＄
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <h3 className="payment-card-code">
                            {booking.bookingCode || 'Reserva'}
                          </h3>
                          <p className="payment-card-guest">
                            {booking.guestName || 'Huésped no disponible'}
                          </p>
                        </div>
                      </div>

                      <div className="page-detail">
                        <span className="page-detail-label">
                          Habitación
                        </span>
                        <span className="page-detail-value">
                          {booking.roomId?.number || 'No disponible'}
                        </span>
                      </div>

                      <div className="page-detail">
                        <span className="page-detail-label">
                          Total de la reserva
                        </span>
                        <span className="page-detail-value">
                          {formatCurrency(booking.totalAmount)}
                        </span>
                      </div>

                      <div className="page-detail">
                        <span className="page-detail-label">
                          Total pagado
                        </span>
                        <span className="page-detail-value">
                          {formatCurrency(booking.totalPaid)}
                        </span>
                      </div>

                      <div className="payment-balance">
                        <div>
                          <span className="payment-balance-label">
                            {isPaid ? 'Estado del pago' : 'Saldo pendiente'}
                          </span>
                          <div
                            className="payment-balance-value"
                            style={{
                              color: isPaid ? '#326844' : '#8B6528',
                              marginTop: 5,
                            }}
                          >
                            {isPaid
                              ? 'Pagado'
                              : formatCurrency(pendingAmount)}
                          </div>
                        </div>

                        <span
                          className={`status-pill ${
                            isPaid ? 'status-paid' : 'status-pending'
                          }`}
                        >
                          {isPaid ? 'Al día' : 'Pendiente'}
                        </span>
                      </div>

                      {!isPaid && (
                        <button
                          type="button"
                          className="page-button card-action"
                          onClick={() => openPaymentForm(booking)}
                        >
                          Registrar pago
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

      {selectedBooking && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePaymentForm();
            }
          }}
        >
          <section
            className="modal-panel modal-panel-compact"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-title"
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title" id="payment-title">
                  Registrar pago
                </h2>
                <p className="modal-subtitle">
                  Registra el abono de la reserva seleccionada.
                </p>
              </div>

              <button
                type="button"
                className="page-button page-button-secondary"
                onClick={closePaymentForm}
                disabled={loading}
                aria-label="Cerrar formulario"
              >
                ✕
              </button>
            </div>

            <div className="history-card">
              <div className="page-detail">
                <span className="page-detail-label">Reserva</span>
                <strong className="page-detail-value">
                  {selectedBooking.bookingCode || 'Sin código'}
                </strong>
              </div>

              <div className="page-detail">
                <span className="page-detail-label">Huésped</span>
                <span className="page-detail-value">
                  {selectedBooking.guestName || 'No disponible'}
                </span>
              </div>

              <div className="page-detail">
                <span className="page-detail-label">Saldo pendiente</span>
                <strong className="page-detail-value">
                  {formatCurrency(getPendingAmount(selectedBooking))}
                </strong>
              </div>
            </div>

            <form onSubmit={handleRegisterPayment}>
              <div className="form-field" style={{ marginBottom: 18 }}>
                <label htmlFor="payment-amount">Valor del pago (COP)</label>
                <input
                  id="payment-amount"
                  className="page-input"
                  type="number"
                  min="1"
                  max={getPendingAmount(selectedBooking)}
                  step="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Ingresa el valor"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="payment-method">Método de pago</label>
                <select
                  id="payment-method"
                  className="page-select"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  required
                >
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="TRANSFER">Transferencia</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="page-button page-button-secondary"
                  onClick={closePaymentForm}
                  disabled={loading}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="page-button"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Confirmar pago'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}