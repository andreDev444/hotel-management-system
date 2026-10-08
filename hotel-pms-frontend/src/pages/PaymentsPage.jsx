import { useEffect, useState } from 'react';

export default function PaymentsPage() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const [loading, setLoading] = useState(false);

  const fetchBookings = async () => {
    try {
      const response = await fetch(
        'http://127.0.0.1:5000/api/bookings'
      );

      if (!response.ok) {
        throw new Error('No se pudieron obtener las reservas');
      }

      const data = await response.json();

      setBookings(data);
    } catch (error) {
      console.error('Error obteniendo reservas:', error);

      alert('No se pudieron cargar las reservas.');
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getPendingAmount = (booking) => {
    const total = Number(booking.totalAmount || 0);
    const paid = Number(booking.totalPaid || 0);

    return total - paid;
  };

  const handleRegisterPayment = async (e) => {
    e.preventDefault();

    if (!selectedBooking) {
      return;
    }

    const paymentAmount = Number(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      alert('Ingresa un valor válido.');
      return;
    }

    const pendingAmount = getPendingAmount(selectedBooking);

    if (paymentAmount > pendingAmount) {
      alert(
        `El pago no puede superar el saldo pendiente de $${pendingAmount.toLocaleString(
          'es-CO'
        )}.`
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        'http://127.0.0.1:5000/api/payments',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            bookingId: selectedBooking._id,
            amount: paymentAmount,
            paymentMethod,
            receivedBy: 'Recepción',
            role: 'RECEPTIONIST'
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details || data.error || 'No se pudo registrar el pago'
        );
      }

      alert('Pago registrado correctamente.');

      setAmount('');
      setSelectedBooking(null);

      await fetchBookings();

    } catch (error) {
      console.error('Error registrando pago:', error);

      alert(error.message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: '30px',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <div style={{ marginBottom: '30px' }}>
        <h1>💳 Gestión de Pagos</h1>

        <p style={{ color: '#666' }}>
          Consulta saldos y registra pagos de las reservas.
        </p>
      </div>

      {bookings.length === 0 ? (
        <p>No hay reservas registradas.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}
        >
          {bookings.map((booking) => {
            const pendingAmount = getPendingAmount(booking);

            return (
              <div
                key={booking._id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '20px',
                  backgroundColor: '#fff',
                  boxShadow:
                    '0 2px 5px rgba(0,0,0,0.08)'
                }}
              >
                <h3>
                  📋 {booking.bookingCode}
                </h3>

                <p>
                  <strong>Huésped:</strong>{' '}
                  {booking.guestName}
                </p>

                <p>
                  <strong>Habitación:</strong>{' '}
                  {booking.roomId?.number ||
                    'No disponible'}
                </p>

                <hr />

                <p>
                  <strong>Total:</strong>{' '}
                  ${Number(
                    booking.totalAmount || 0
                  ).toLocaleString('es-CO')}
                </p>

                <p>
                  <strong>Pagado:</strong>{' '}
                  ${Number(
                    booking.totalPaid || 0
                  ).toLocaleString('es-CO')}
                </p>

                <p
                  style={{
                    fontWeight: 'bold',
                    color:
                      pendingAmount === 0
                        ? '#16a34a'
                        : '#dc2626'
                  }}
                >
                  {pendingAmount === 0
                    ? '✅ PAGADO'
                    : `💰 Saldo pendiente: $${pendingAmount.toLocaleString(
                        'es-CO'
                      )}`}
                </p>

                {pendingAmount > 0 && (
                  <button
                    onClick={() =>
                      setSelectedBooking(booking)
                    }
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    💳 Registrar pago
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedBooking && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor:
              'rgba(0,0,0,0.5)',
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
              maxWidth: '450px',
              borderRadius: '10px',
              padding: '25px'
            }}
          >
            <h2>💳 Registrar pago</h2>

            <p>
              <strong>Reserva:</strong>{' '}
              {selectedBooking.bookingCode}
            </p>

            <p>
              <strong>Huésped:</strong>{' '}
              {selectedBooking.guestName}
            </p>

            <p>
              <strong>Saldo pendiente:</strong>{' '}
              $
              {getPendingAmount(
                selectedBooking
              ).toLocaleString('es-CO')}
            </p>

            <form
              onSubmit={handleRegisterPayment}
            >
              <div style={{ marginBottom: '15px' }}>
                <label>
                  Valor del pago
                </label>

                <input
                  type="number"
                  min="1"
                  max={getPendingAmount(
                    selectedBooking
                  )}
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value)
                  }
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginTop: '6px',
                    boxSizing: 'border-box',
                    border:
                      '1px solid #cbd5e1',
                    borderRadius: '6px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>
                  Método de pago
                </label>

                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value
                    )
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginTop: '6px',
                    border:
                      '1px solid #cbd5e1',
                    borderRadius: '6px'
                  }}
                >
                  <option value="CASH">
                    💵 Efectivo
                  </option>

                  <option value="CARD">
                    💳 Tarjeta
                  </option>

                  <option value="TRANSFER">
                    🏦 Transferencia
                  </option>
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBooking(null);
                    setAmount('');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#6b7280',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {loading
                    ? 'Guardando...'
                    : '💾 Registrar pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}