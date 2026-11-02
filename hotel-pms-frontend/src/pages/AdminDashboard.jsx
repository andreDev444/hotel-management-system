import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar, { adminMenuItems } from '../components/Sidebar';
import './AdminDashboard.css';

const API = 'http://localhost:5000/api';

const roleLabels = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  RECEPTIONIST: 'Recepcionista',
  HOUSEKEEPING: 'Personal de aseo'
};

const roomStatusLabels = {
  AVAILABLE: 'Disponible',
  OCCUPIED: 'Ocupada',
  RESERVED: 'Reservada',
  CLEANING: 'En aseo',
  OUT_OF_SERVICE: 'Fuera de servicio'
};

const money = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const emptyEmployee = { name: '', email: '', password: '', role: 'RECEPTIONIST' };
const emptyRoom = { number: '', type: 'Sencilla', capacity: 1, pricePerNight: '' };

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || 'No se pudo completar la operación.');
  }

  return data;
}

function StatCard({ label, value, detail }) {
  return (
    <article className="admin-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}

function Field({ label, children }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function StatusPill({ children, variant = '' }) {
  return <span className={`admin-status ${variant}`}>{children}</span>;
}

function EmptyState({ children }) {
  return <div className="admin-empty">{children}</div>;
}

export default function AdminDashboard() {
  const location = useLocation();

  const routeTabs = {
    '/admin': 'Resumen general',
    '/admin/empleados': 'Usuarios y empleados',
    '/admin/habitaciones': 'Habitaciones',
    '/admin/auditoria': 'Auditoría'
  };

  const [activeTab, setActiveTab] = useState(routeTabs[location.pathname] || 'Resumen general');
  const [peopleTab, setPeopleTab] = useState('empleados');

  const [users, setUsers] = useState([]);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [employeeForm, setEmployeeForm] = useState(emptyEmployee);
  const [roomForm, setRoomForm] = useState(emptyRoom);
  const [guestEditing, setGuestEditing] = useState(null);
  const [employeeEditing, setEmployeeEditing] = useState(null);
  const [roomEditing, setRoomEditing] = useState(null);

  const [search, setSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditStart, setAuditStart] = useState('');
  const [auditEnd, setAuditEnd] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const notify = (text, isError = false) => {
    setMessage(isError ? '' : text);
    setError(isError ? text : '');
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [usersData, guestsData, roomsData, auditData] = await Promise.all([
        apiRequest('/users'),
        apiRequest('/guests'),
        apiRequest('/rooms'),
        apiRequest('/audit')
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setGuests(Array.isArray(guestsData) ? guestsData : []);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setAuditLogs(Array.isArray(auditData) ? auditData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setActiveTab(routeTabs[location.pathname] || 'Resumen general');
    setSearch('');
    setMessage('');
    setError('');
  }, [location.pathname]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeEmployees = users.filter((user) => user.isActive !== false).length;
  const activeGuests = guests.filter((guest) => guest.isActive !== false).length;

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim();

    return users.filter((user) =>
      `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(term)
    );
  }, [users, search]);

  const filteredGuests = useMemo(() => {
    const term = search.toLowerCase().trim();

    return guests.filter((guest) =>
      `${guest.name} ${guest.document} ${guest.email} ${guest.phone || ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [guests, search]);

  const filteredRooms = useMemo(() => {
    const term = search.toLowerCase().trim();

    return rooms.filter((room) =>
      `${room.number} ${room.type} ${room.status}`.toLowerCase().includes(term)
    );
  }, [rooms, search]);

  const filteredLogs = useMemo(() => {
    const term = auditSearch.toLowerCase().trim();

    return auditLogs.filter((log) =>
      `${log.user} ${log.role} ${log.action}`.toLowerCase().includes(term)
    );
  }, [auditLogs, auditSearch]);

  const refreshAudit = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (auditStart) params.set('start', new Date(auditStart).toISOString());
      if (auditEnd) params.set('end', new Date(auditEnd).toISOString());
      if (auditSearch.trim()) params.set('search', auditSearch.trim());

      const data = await apiRequest(`/audit?${params.toString()}`);

      setAuditLogs(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitEmployee = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (employeeEditing) {
        const payload = {
          name: employeeEditing.name,
          email: employeeEditing.email,
          role: employeeEditing.role,
          isActive: employeeEditing.isActive
        };

        if (employeeEditing.password) {
          payload.password = employeeEditing.password;
        }

        await apiRequest(`/users/${employeeEditing._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ ...payload, executedBy: 'Admin Principal' })
        });

        setEmployeeEditing(null);
        notify('Empleado actualizado correctamente.');
      } else {
        await apiRequest('/users', {
          method: 'POST',
          body: JSON.stringify({ ...employeeForm, executedBy: 'Admin Principal' })
        });

        setEmployeeForm(emptyEmployee);
        notify('Empleado registrado correctamente.');
      }

      await loadData();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const deleteEmployee = async (user) => {
    if (!window.confirm(`¿Eliminar definitivamente a ${user.name}?`)) return;

    try {
      await apiRequest(`/users/${user._id}`, {
        method: 'DELETE',
        body: JSON.stringify({ executedBy: 'Admin Principal' })
      });

      notify('Empleado eliminado correctamente.');
      await loadData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const toggleGuest = async (guest) => {
    const nextActive = guest.isActive === false;

    if (!window.confirm(`¿${nextActive ? 'Activar' : 'Desactivar'} a ${guest.name}?`)) return;

    try {
      await apiRequest(`/guests/${guest._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isActive: nextActive,
          executedBy: 'Admin Principal'
        })
      });

      notify(`Huésped ${nextActive ? 'activado' : 'desactivado'} correctamente.`);
      await loadData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const submitGuest = async (event) => {
    event.preventDefault();
    if (!guestEditing) return;

    setSaving(true);

    try {
      await apiRequest(`/guests/${guestEditing._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: guestEditing.name,
          document: guestEditing.document,
          email: guestEditing.email,
          phone: guestEditing.phone,
          executedBy: 'Admin Principal'
        })
      });

      setGuestEditing(null);
      notify('Datos del huésped actualizados.');
      await loadData();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const submitRoom = async (event) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      number: roomEditing ? roomEditing.number : roomForm.number,
      type: roomEditing ? roomEditing.type : roomForm.type,
      capacity: Number(roomEditing ? roomEditing.capacity : roomForm.capacity),
      pricePerNight: Number(roomEditing ? roomEditing.pricePerNight : roomForm.pricePerNight),
      executedBy: 'Admin Principal'
    };

    try {
      if (roomEditing) {
        await apiRequest(`/rooms/${roomEditing._id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });

        setRoomEditing(null);
        notify('Habitación actualizada correctamente.');
      } else {
        await apiRequest('/rooms', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        setRoomForm(emptyRoom);
        notify('Habitación registrada correctamente.');
      }

      await loadData();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const changeRoomStatus = async (room, status) => {
    if (room.status === status) return;

    if (!window.confirm(`¿Cambiar habitación ${room.number} a ${roomStatusLabels[status]}?`)) return;

    try {
      await apiRequest(`/rooms/${room._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          user: 'Admin Principal',
          role: 'ADMIN'
        })
      });

      notify('Estado de habitación actualizado.');
      await loadData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const deleteRoom = async (room) => {
    if (!window.confirm(`¿Eliminar la habitación ${room.number}? Esta acción no se puede deshacer.`)) return;

    try {
      await apiRequest(`/rooms/${room._id}`, {
        method: 'DELETE',
        body: JSON.stringify({ executedBy: 'Admin Principal' })
      });

      notify('Habitación eliminada correctamente.');
      await loadData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const exportAuditCsv = () => {
    const rows = [
      ['Fecha y hora', 'Usuario', 'Rol', 'Acción'],
      ...filteredLogs.map((log) => [
        new Date(log.timestamp).toLocaleString('es-CO'),
        log.user || '',
        log.role || '',
        log.action || ''
      ])
    ];

    const csv = rows.map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')
    ).join('\n');

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'auditoria-grand-hotel.csv';
    link.click();

    URL.revokeObjectURL(url);
  };

  const peopleTitle = peopleTab === 'usuarios' ? 'Huéspedes' : 'Empleados';

  return (
    <div className="admin-layout">
      <Sidebar
        items={adminMenuItems}
        roleLabel="Administración"
        subtitle="Panel administrativo"
      />

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <span className="admin-eyebrow">GRAND HOTEL BOUTIQUE</span>
            <h1>Panel de administración</h1>
            <p>Gestión de usuarios, personal, habitaciones y registros del sistema.</p>
          </div>

          <button className="admin-refresh" type="button" onClick={loadData}>
            ↻ Actualizar datos
          </button>
        </header>

        {message && <div className="admin-alert success">{message}</div>}
        {error && <div className="admin-alert error">{error}</div>}

        {loading ? (
          <div className="admin-loading">Cargando información del hotel...</div>
        ) : (
          <>
            {activeTab === 'Resumen general' && (
              <section>
                <div className="admin-section-heading">
                  <div>
                    <h2>Resumen general</h2>
                    <p>Indicadores generales de los recursos registrados.</p>
                  </div>
                </div>

                <div className="admin-stats-grid">
                  <StatCard
                    label="Empleados registrados"
                    value={users.length}
                    detail={`${activeEmployees} activos`}
                  />
                  <StatCard
                    label="Huéspedes registrados"
                    value={guests.length}
                    detail={`${activeGuests} activos`}
                  />
                  <StatCard
                    label="Habitaciones registradas"
                    value={rooms.length}
                  />
                  <StatCard
                    label="Registros de auditoría"
                    value={auditLogs.length}
                    detail="Acciones históricas"
                  />
                </div>

                <div className="admin-welcome-panel">
                  <span className="admin-eyebrow">ADMINISTRACIÓN DEL HOTEL</span>
                  <h3>Control y organización de Grand Hotel Boutique</h3>
                  <p>
                    Desde este panel puedes mantener actualizada la información del
                    personal, los huéspedes y las habitaciones, además de consultar
                    el historial de actividad.
                  </p>
                </div>
              </section>
            )}

            {activeTab === 'Usuarios y empleados' && (
              <section>
                <div className="admin-section-heading">
                  <div>
                    <h2>Usuarios y empleados</h2>
                    <p>Consulta huéspedes y administra las cuentas del personal.</p>
                  </div>
                </div>

                <div className="admin-inner-tabs">
                  <button
                    className={peopleTab === 'usuarios' ? 'active' : ''}
                    onClick={() => {
                      setPeopleTab('usuarios');
                      setSearch('');
                      setGuestEditing(null);
                    }}
                  >
                    Usuarios / Huéspedes
                  </button>

                  <button
                    className={peopleTab === 'empleados' ? 'active' : ''}
                    onClick={() => {
                      setPeopleTab('empleados');
                      setSearch('');
                      setEmployeeEditing(null);
                    }}
                  >
                    Empleados
                  </button>
                </div>

                <div className="admin-panel admin-table-panel">
                  <div className="admin-table-heading">
                    <div>
                      <h3>
                        {peopleTitle} ({peopleTab === 'usuarios' ? guests.length : users.length})
                      </h3>
                      <p>
                        {peopleTab === 'usuarios'
                          ? 'Los huéspedes se registran desde Recepción; aquí puedes consultar y actualizar sus datos.'
                          : 'Crea cuentas del personal y administra sus roles y estados.'}
                      </p>
                    </div>

                    <input
                      className="admin-search"
                      placeholder={`Buscar ${peopleTab === 'usuarios' ? 'huésped' : 'empleado'}...`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {peopleTab === 'empleados' && (
                    <form className="admin-form compact" onSubmit={submitEmployee}>
                      <h3>
                        {employeeEditing
                          ? `Editar empleado: ${employeeEditing.name}`
                          : 'Registrar empleado'}
                      </h3>

                      <div className="admin-form-grid">
                        <Field label="Nombre completo">
                          <input
                            required
                            value={employeeEditing ? employeeEditing.name : employeeForm.name}
                            onChange={(e) =>
                              employeeEditing
                                ? setEmployeeEditing({ ...employeeEditing, name: e.target.value })
                                : setEmployeeForm({ ...employeeForm, name: e.target.value })
                            }
                          />
                        </Field>

                        <Field label="Correo electrónico">
                          <input
                            type="email"
                            required
                            value={employeeEditing ? employeeEditing.email : employeeForm.email}
                            onChange={(e) =>
                              employeeEditing
                                ? setEmployeeEditing({ ...employeeEditing, email: e.target.value })
                                : setEmployeeForm({ ...employeeForm, email: e.target.value })
                            }
                          />
                        </Field>

                        {employeeEditing && (
                          <Field label="Nueva contraseña (opcional)">
                            <input
                              type="password"
                              minLength={6}
                              placeholder="Dejar en blanco para conservarla"
                              value={employeeEditing.password || ''}
                              onChange={(e) =>
                                setEmployeeEditing({
                                  ...employeeEditing,
                                  password: e.target.value
                                })
                              }
                            />
                          </Field>
                        )}

                        {!employeeEditing && (
                          <Field label="Contraseña inicial">
                            <input
                              type="password"
                              minLength={6}
                              required
                              value={employeeForm.password}
                              onChange={(e) =>
                                setEmployeeForm({ ...employeeForm, password: e.target.value })
                              }
                            />
                          </Field>
                        )}

                        <Field label="Rol">
                          <select
                            value={employeeEditing ? employeeEditing.role : employeeForm.role}
                            onChange={(e) =>
                              employeeEditing
                                ? setEmployeeEditing({ ...employeeEditing, role: e.target.value })
                                : setEmployeeForm({ ...employeeForm, role: e.target.value })
                            }
                          >
                            {Object.entries(roleLabels).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </Field>

                        {employeeEditing && (
                          <Field label="Estado de la cuenta">
                            <select
                              value={employeeEditing.isActive === false ? 'false' : 'true'}
                              onChange={(e) =>
                                setEmployeeEditing({
                                  ...employeeEditing,
                                  isActive: e.target.value === 'true'
                                })
                              }
                            >
                              <option value="true">Activo</option>
                              <option value="false">Inactivo</option>
                            </select>
                          </Field>
                        )}
                      </div>

                      <div className="admin-form-actions">
                        <button className="admin-primary-btn" disabled={saving}>
                          {saving
                            ? 'Guardando...'
                            : employeeEditing
                              ? 'Guardar cambios'
                              : '+ Registrar empleado'}
                        </button>

                        {employeeEditing && (
                          <button
                            type="button"
                            className="admin-secondary-btn"
                            onClick={() => setEmployeeEditing(null)}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </form>
                  )}

                  {peopleTab === 'usuarios' && guestEditing && (
                    <form className="admin-form compact" onSubmit={submitGuest}>
                      <h3>Editar huésped: {guestEditing.name}</h3>

                      <div className="admin-form-grid">
                        <Field label="Nombre">
                          <input
                            required
                            value={guestEditing.name}
                            onChange={(e) =>
                              setGuestEditing({ ...guestEditing, name: e.target.value })
                            }
                          />
                        </Field>

                        <Field label="Documento">
                          <input
                            required
                            value={guestEditing.document}
                            onChange={(e) =>
                              setGuestEditing({ ...guestEditing, document: e.target.value })
                            }
                          />
                        </Field>

                        <Field label="Correo">
                          <input
                            type="email"
                            required
                            value={guestEditing.email}
                            onChange={(e) =>
                              setGuestEditing({ ...guestEditing, email: e.target.value })
                            }
                          />
                        </Field>

                        <Field label="Teléfono">
                          <input
                            value={guestEditing.phone || ''}
                            onChange={(e) =>
                              setGuestEditing({ ...guestEditing, phone: e.target.value })
                            }
                          />
                        </Field>
                      </div>

                      <div className="admin-form-actions">
                        <button className="admin-primary-btn" disabled={saving}>
                          Guardar cambios
                        </button>
                        <button
                          type="button"
                          className="admin-secondary-btn"
                          onClick={() => setGuestEditing(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="admin-table-wrap">
                    {peopleTab === 'empleados' ? (
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Empleado</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user) => (
                            <tr key={user._id}>
                              <td>
                                <strong>{user.name}</strong>
                                <small>{user.email}</small>
                              </td>
                              <td>{roleLabels[user.role] || user.role}</td>
                              <td>
                                <StatusPill variant={user.isActive === false ? 'inactive' : 'active'}>
                                  {user.isActive === false ? 'Inactivo' : 'Activo'}
                                </StatusPill>
                              </td>
                              <td className="admin-actions">
                                <button
                                  className="admin-link-btn"
                                  onClick={() => {
                                    setEmployeeEditing({ ...user, password: '' });
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                >
                                  Editar
                                </button>
                                <button
                                  className="admin-link-btn danger"
                                  onClick={() => deleteEmployee(user)}
                                >
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Huésped</th>
                            <th>Documento</th>
                            <th>Contacto</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredGuests.map((guest) => (
                            <tr key={guest._id}>
                              <td><strong>{guest.name}</strong></td>
                              <td>{guest.document}</td>
                              <td>
                                {guest.email}
                                <small>{guest.phone || 'Sin teléfono'}</small>
                              </td>
                              <td>
                                <StatusPill variant={guest.isActive === false ? 'inactive' : 'active'}>
                                  {guest.isActive === false ? 'Inactivo' : 'Activo'}
                                </StatusPill>
                              </td>
                              <td className="admin-actions">
                                <button
                                  className="admin-link-btn"
                                  onClick={() => {
                                    setGuestEditing({ ...guest });
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                >
                                  Editar
                                </button>
                                <button
                                  className="admin-link-btn"
                                  onClick={() => toggleGuest(guest)}
                                >
                                  {guest.isActive === false ? 'Activar' : 'Desactivar'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {(
                      (peopleTab === 'empleados' && filteredUsers.length === 0) ||
                      (peopleTab === 'usuarios' && filteredGuests.length === 0)
                    ) && <EmptyState>No se encontraron registros.</EmptyState>}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'Habitaciones' && (
              <section>
                <div className="admin-section-heading">
                  <div>
                    <h2>Habitaciones</h2>
                    <p>Registra, edita y administra las habitaciones del hotel.</p>
                  </div>
                </div>

                <form className="admin-form" onSubmit={submitRoom}>
                  <h3>
                    {roomEditing
                      ? `Editar habitación ${roomEditing.number}`
                      : 'Registrar habitación'}
                  </h3>

                  <div className="admin-form-grid">
                    <Field label="Número">
                      <input
                        required
                        value={roomEditing ? roomEditing.number : roomForm.number}
                        onChange={(e) =>
                          roomEditing
                            ? setRoomEditing({ ...roomEditing, number: e.target.value })
                            : setRoomForm({ ...roomForm, number: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Tipo">
                      <select
                        value={roomEditing ? roomEditing.type : roomForm.type}
                        onChange={(e) =>
                          roomEditing
                            ? setRoomEditing({ ...roomEditing, type: e.target.value })
                            : setRoomForm({ ...roomForm, type: e.target.value })
                        }
                      >
                        <option>Sencilla</option>
                        <option>Doble</option>
                        <option>Suite</option>
                        <option>Familiar</option>
                      </select>
                    </Field>

                    <Field label="Capacidad">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={roomEditing ? roomEditing.capacity : roomForm.capacity}
                        onChange={(e) =>
                          roomEditing
                            ? setRoomEditing({ ...roomEditing, capacity: e.target.value })
                            : setRoomForm({ ...roomForm, capacity: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Precio por noche (COP)">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        required
                        value={roomEditing ? roomEditing.pricePerNight : roomForm.pricePerNight}
                        onChange={(e) =>
                          roomEditing
                            ? setRoomEditing({ ...roomEditing, pricePerNight: e.target.value })
                            : setRoomForm({ ...roomForm, pricePerNight: e.target.value })
                        }
                      />
                    </Field>
                  </div>

                  <div className="admin-form-actions">
                    <button className="admin-primary-btn" disabled={saving}>
                      {saving
                        ? 'Guardando...'
                        : roomEditing
                          ? 'Guardar cambios'
                          : '+ Registrar habitación'}
                    </button>

                    {roomEditing && (
                      <button
                        type="button"
                        className="admin-secondary-btn"
                        onClick={() => setRoomEditing(null)}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>

                <div className="admin-panel admin-table-panel">
                  <div className="admin-table-heading">
                    <div>
                      <h3>Inventario de habitaciones ({rooms.length})</h3>
                    </div>
                    <input
                      className="admin-search"
                      placeholder="Buscar habitación..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Habitación</th>
                          <th>Capacidad</th>
                          <th>Precio / noche</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRooms.map((room) => (
                          <tr key={room._id}>
                            <td>
                              <strong>{room.number}</strong>
                              <small>{room.type}</small>
                            </td>
                            <td>{room.capacity} personas</td>
                            <td>{money(room.pricePerNight)}</td>
                            <td>
                              <select
                                className="admin-status-select"
                                value={room.status}
                                onChange={(e) => changeRoomStatus(room, e.target.value)}
                              >
                                {Object.entries(roomStatusLabels).map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="admin-actions">
                              <button
                                className="admin-link-btn"
                                onClick={() => {
                                  setRoomEditing({ ...room });
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                              >
                                Editar
                              </button>
                              <button
                                className="admin-link-btn danger"
                                onClick={() => deleteRoom(room)}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredRooms.length === 0 && (
                      <EmptyState>No se encontraron habitaciones.</EmptyState>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'Auditoría' && (
              <section>
                <div className="admin-section-heading">
                  <div>
                    <h2>Auditoría</h2>
                    <p>
                      Consulta el historial de acciones del sistema. Los registros son de solo lectura.
                    </p>
                  </div>

                  <button className="admin-secondary-btn" onClick={exportAuditCsv}>
                    Exportar CSV
                  </button>
                </div>

                <div className="admin-panel admin-audit-filters">
                  <Field label="Buscar por usuario, rol o acción">
                    <input
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      placeholder="Ej. Recepción, ADMIN, Check-In..."
                    />
                  </Field>

                  <Field label="Desde (fecha y hora)">
                    <input
                      type="datetime-local"
                      value={auditStart}
                      onChange={(e) => setAuditStart(e.target.value)}
                    />
                  </Field>

                  <Field label="Hasta (fecha y hora)">
                    <input
                      type="datetime-local"
                      value={auditEnd}
                      onChange={(e) => setAuditEnd(e.target.value)}
                    />
                  </Field>

                  <div className="admin-form-actions">
                    <button className="admin-primary-btn" onClick={refreshAudit}>
                      Aplicar filtros
                    </button>
                    <button
                      className="admin-secondary-btn"
                      onClick={() => {
                        setAuditSearch('');
                        setAuditStart('');
                        setAuditEnd('');
                        apiRequest('/audit')
                          .then((data) => setAuditLogs(Array.isArray(data) ? data : []))
                          .catch((err) => notify(err.message, true));
                      }}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div className="admin-panel admin-table-panel">
                  <div className="admin-table-heading">
                    <h3>Acciones registradas ({filteredLogs.length})</h3>
                  </div>

                  <div className="admin-audit-list">
                    {filteredLogs.map((log) => (
                      <article className="admin-audit-row" key={log._id}>
                        <div className="admin-audit-date">
                          {log.timestamp
                            ? new Date(log.timestamp).toLocaleString('es-CO')
                            : 'Fecha no disponible'}
                        </div>
                        <div className="admin-audit-content">
                          <strong>{log.action}</strong>
                          <span>{log.user || 'Usuario'} · {log.role || 'Sin rol'}</span>
                        </div>
                      </article>
                    ))}

                    {filteredLogs.length === 0 && (
                      <EmptyState>No hay acciones que coincidan con los filtros.</EmptyState>
                    )}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}