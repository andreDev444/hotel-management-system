import React, { useState } from 'react';

const extraServices = [
  { id: 1, name: 'Desayuno Buffet', price: 25000 },
  { id: 2, name: 'Bebida / Minibar', price: 12000 },
  { id: 3, name: 'Servicio de Lavandería', price: 35000 },
  { id: 4, name: 'Parqueadero (por día)', price: 15000 },
];

export default function CheckoutModal({ booking, onClose, onCompleteCheckout }) {
  const [consumedServices, setConsumedServices] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');

  const addService = (service) => {
    setConsumedServices(prev => [...prev, service]);
  };

  const servicesTotal = consumedServices.reduce((sum, item) => sum + item.price, 0);
  const totalToPay = booking.totalAmount + servicesTotal;

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    onCompleteCheckout(booking, totalToPay, paymentMethod, consumedServices);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1e1e1e', padding: '24px', borderRadius: '8px',
        width: '480px', color: '#fff', border: '1px solid #444'
      }}>
        <h2>🚪 Check-Out & Liquidación - Habitación {booking.roomNumber}</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Huésped: <b>{booking.guestName}</b> ({booking.document})</p>

        {/* Consumos Extras */}
        <div style={{ margin: '16px 0', borderTop: '1px solid #333', borderBottom: '1px solid #333', padding: '12px 0' }}>
          <h4>➕ Agregar Servicios Adicionales:</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            {extraServices.map(s => (
              <button 
                key={s.id} 
                type="button" 
                onClick={() => addService(s)}
                style={{
                  padding: '4px 8px', backgroundColor: '#333', border: '1px solid #555',
                  color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem'
                }}
              >
                + {s.name} (${s.price.toLocaleString()})
              </button>
            ))}
          </div>
        </div>

        {/* Desglose de la Cuenta */}
        <div style={{ backgroundColor: '#121212', padding: '12px', borderRadius: '6px', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Alojamiento (Reserva {booking.bookingCode}):</span>
            <span>${booking.totalAmount.toLocaleString()}</span>
          </div>

          {consumedServices.map((s, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '0.85rem' }}>
              <span>+ {s.name}:</span>
              <span>${s.price.toLocaleString()}</span>
            </div>
          ))}

          <hr style={{ borderColor: '#333', margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', color: '#22c55e' }}>
            <span>TOTAL A PAGAR:</span>
            <span>${totalToPay.toLocaleString()}</span>
          </div>
        </div>

        {/* Método de Pago */}
        <form onSubmit={handleCheckoutSubmit} style={{ marginTop: '16px' }}>
          <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Método de Pago:</label>
          <select 
            value={paymentMethod} 
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#2d2d2d', color: '#fff', marginBottom: '16px' }}
          >
            <option value="CREDIT_CARD"> Tarjeta de Crédito / Débito</option>
            <option value="CASH"> Efectivo</option>
            <option value="TRANSFER"> Transferencia Bancaria</option>
          </select>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#444', color: '#fff', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
              Pagar y Realizar Check-Out 
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}