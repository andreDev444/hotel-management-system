import React, { useState } from 'react';

export default function HousekeepingPanel({ rooms, onStatusChange, onReportIssue }) {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [issueDescription, setIssueDescription] = useState('');

  // Filtrar solo las habitaciones que necesitan limpieza o mantenimiento
  const pendingRooms = rooms.filter(
    r => r.status === 'CLEANING' || r.status === 'OUT_OF_SERVICE'
  );

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!selectedRoom || !issueDescription) {
      alert('Por favor selecciona una habitación y describe el daño.');
      return;
    }

    onReportIssue(Number(selectedRoom), issueDescription);
    alert(`Reporte enviado para la Habitación ${selectedRoom}. La habitación pasó a "Fuera de Servicio".`);
    setSelectedRoom('');
    setIssueDescription('');
  };

  return (
    <div style={{ marginTop: '32px', backgroundColor: '#1e1e1e', padding: '24px', borderRadius: '8px', border: '1px solid #333' }}>
      <h2>🧹 Módulo de Limpieza & Mantenimiento</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
        
        {/* Panel 1: Habitaciones pendientes de aseo */}
        <div>
          <h3> Habitaciones Pendientes de Aseo ({pendingRooms.length})</h3>
          {pendingRooms.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>No hay habitaciones pendientes de limpieza en este momento.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              {pendingRooms.map(room => (
                <div key={room.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: '#2d2d2d', padding: '12px', borderRadius: '6px', borderLeft: room.status === 'CLEANING' ? '4px solid #f97316' : '4px solid #ef4444'
                }}>
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>Habitación {room.number}</strong>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>
                      Estado: {room.status === 'CLEANING' ? '🟠 En Limpieza' : '🔴 Fuera de Servicio'}
                    </p>
                  </div>

                  <button
                    onClick={() => onStatusChange(room.id, 'AVAILABLE')}
                    style={{
                      padding: '8px 12px', backgroundColor: '#22c55e', color: '#fff',
                      border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                  >
                     Marcar Limpia y Lista
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel 2: Formulario de Reporte de Daños */}
        <div style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '6px' }}>
          <h3>⚠️ Reportar Daño / Mantenimiento</h3>
          <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <div>
              <label style={{ fontSize: '0.85rem' }}>Seleccionar Habitación:</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
              >
                <option value="">-- Seleccionar --</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>Habitación {r.number} ({r.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem' }}>Descripción del Problema / Falla:</label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Ej. Fuga de agua en el baño, aire acondicionado descompuesto..."
                rows="3"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', resize: 'none' }}
              />
            </div>

            <button
              type="submit"
              style={{ padding: '10px', backgroundColor: '#ef4444', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
               Bloquear por Mantenimiento
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}