import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const menuItems = [
  {
    label: 'Habitaciones',
    path: '/recepcion',
    icon: '▦'
  },
  {
    label: 'Huéspedes',
    path: '/huespedes',
    icon: '♙'
  },
  {
    label: 'Reservas',
    path: '/recepcion',
    icon: '▣'
  },
  {
    label: 'Pagos',
    path: '/pagos',
    icon: '＄'
  }
];

export default function Sidebar() {
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
        {menuItems.map((item, index) => (
          <NavLink
            key={`${item.label}-${index}`}
            to={item.path}
            end={item.path === '/recepcion'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-icon">
              {item.icon}
            </span>

            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-avatar">R</div>

        <div>
          <strong>Recepción</strong>
          <span>Panel de trabajo</span>
        </div>
      </div>
    </aside>
  );
}