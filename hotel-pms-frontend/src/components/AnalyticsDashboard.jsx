import React from 'react';

export default function AnalyticsDashboard({ rooms, bookings }) {
  const totalRooms = rooms.length;
  
  // Contadores de estado
  const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED').length;
  const reservedRooms = rooms.filter(r => r.status === 'RESERVED').length;
  const availableRooms = rooms.filter(r => r.status === 'AVAILABLE').length;
  const cleaningRooms = rooms.filter(r => r.status === 'CLEANING').length;
  const outOfServiceRooms = rooms.filter(r => r.status === 'OUT_OF_SERVICE').length;

  // Calculo de KPI Hoteleros
  const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;
  
  // Suma de ingresos de reservas activas/cobradas
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPaid || b.totalAmount || 0), 0);
  
  // ADR: Promedio pagado por habitación ocupada
  const adr = occupiedRooms > 0 ? (totalRevenue / occupiedRooms).toFixed(0) : 0;
  
  // RevPAR: Ingreso promedio por cada habitación existente en el hotel
  const revPar = totalRooms > 0 ? (totalRevenue / totalRooms).toFixed(0) : 0;

  return (
    <div style={{ marginTop: '32px', backgroundColor: '#1e1e1e', padding: '24px', borderRadius: '8px', border: '1px solid #333' }}>
      <h2>📊 Dashboard de Analítica e Indicadores (KPIs)</h2>
      <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>
        Métricas de rendimiento operativo y financiero del hotel en tiempo real.
      </p>

      {/* Tarjetas Principales de KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        <div style={kpiCardStyle('#3b82f6')}>
          <span style={{ fontSize: '0.85rem', color: '#aaa' }}>% OCUPACIÓN</span>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '2rem' }}>{occupancyRate}%</h2>
          <small style={{ color: '#888' }}>{occupiedRooms} de {totalRooms} habs.</small>
        </div>

        <div style={kpiCardStyle('#22c55e')}>
          <span style={{ fontSize: '0.85rem', color: '#aaa' }}>INGRESOS TOTALES</span>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '1.8rem' }}>${Number(totalRevenue).toLocaleString()}</h2>
          <small style={{ color: '#888' }}>Alojamiento + Servicios</small>
        </div>

        <div style={kpiCardStyle('#eab308')}>
          <span style={{ fontSize: '0.85rem', color: '#aaa' }}>ADR (Tarifa Promedio)</span>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '1.8rem' }}>${Number(adr).toLocaleString()}</h2>
          <small style={{ color: '#888' }}>Ingreso / Hab. Ocupada</small>
        </div>

        <div style={kpiCardStyle('#a855f7')}>
          <span style={{ fontSize: '0.85rem', color: '#aaa' }}>RevPAR</span>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '1.8rem' }}>${Number(revPar).toLocaleString()}</h2>
          <small style={{ color: '#888' }}>Ingreso / Hab. Disponible</small>
        </div>

      </div>

      {/* Desglose de Estado del Inventario */}
      <h4>🏨 Distribución del Inventario:</h4>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
        <span style={badgeStyle('#22c55e')}>🟢 Disponibles: {availableRooms}</span>
        <span style={badgeStyle('#3b82f6')}>🔵 Ocupadas: {occupiedRooms}</span>
        <span style={badgeStyle('#eab308')}>🟡 Reservadas: {reservedRooms}</span>
        <span style={badgeStyle('#f97316')}>🟠 En Limpieza: {cleaningRooms}</span>
        <span style={badgeStyle('#ef4444')}>🔴 Fuera de Servicio: {outOfServiceRooms}</span>
      </div>
    </div>
  );
}

const kpiCardStyle = (borderColor) => ({
  backgroundColor: '#121212',
  padding: '16px',
  borderRadius: '8px',
  borderLeft: `5px solid ${borderColor}`,
  borderTop: '1px solid #333',
  borderRight: '1px solid #333',
  borderBottom: '1px solid #333',
});

const badgeStyle = (bgColor) => ({
  backgroundColor: bgColor,
  padding: '6px 12px',
  borderRadius: '16px',
  fontSize: '0.85rem',
  fontWeight: 'bold',
  color: '#fff'
});