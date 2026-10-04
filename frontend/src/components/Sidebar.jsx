import { NavLink } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import './Sidebar.css';

export default function Sidebar() {
  const { connected } = useSocket();
  
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-name">ECO365</span>
        <span className="brand-product">Machine Monitor</span>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-section">
          <NavLink to="/" end className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            Overview
          </NavLink>
          <NavLink to="/machines" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            Machines
          </NavLink>
          <NavLink to="/downtime" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            Downtime
          </NavLink>
          <NavLink to="/analytics" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            Analytics
          </NavLink>
          <NavLink to="/alerts" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            Alerts
          </NavLink>
        </div>
      </nav>
      
      <div className="sidebar-bottom">
        <NavLink to="/system" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className={`system-dot ${connected ? 'online' : 'offline'}`}></span>
          System Status
        </NavLink>
        <NavLink to="/settings" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
          Settings
        </NavLink>
        <NavLink to="/profile" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
          Owner Profile
        </NavLink>
      </div>
    </aside>
  );
}
