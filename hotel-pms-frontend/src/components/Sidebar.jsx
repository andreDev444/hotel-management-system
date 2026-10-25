
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const receptionMenuItems = [
  { label: 'Habitaciones', path: '/recepcion', icon: '▦' },
  { label: 'Huéspedes', path: '/huespedes', icon: '♙' },
  { label: 'Reservas', path: '/recepcion', icon: '▣' },
  { label: 'Pagos', path: '/pagos', icon: '＄' }
];

export const housekeepingMenuItems = [
  { label: 'Panel de aseo', path: '/limpieza', icon: '▦' }
];

export default function Sidebar({
  items = receptionMenuItems,
  roleLabel = 'Recepción',
  subtitle = 'Panel de trabajo'
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">G</div>

        <div>
          <h2>GRAND HOTEL</h2>
          <span>Hotel Management</span>
        </div>
      </div>

      <div className="sidebar-section-title">
        OPERACIONES
      </div>

      <nav className="sidebar-nav">
        {items.map((item, index) => (
          <NavLink
            key={`${item.label}-${index}`}
            to={item.path}
            end
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-avatar">
          {roleLabel.charAt(0)}
        </div>

        <div>
          <strong>{roleLabel}</strong>
          <span>{subtitle}</span>
        </div>
      </div>
    </aside>
  );
}
