import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import Machines from './pages/Machines';
import MachineDetail from './pages/MachineDetail';
import Downtime from './pages/Downtime';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import SystemStatus from './pages/SystemStatus';
import Settings from './pages/Settings';
import OwnerProfile from './pages/OwnerProfile';

export default function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/machines" element={<Machines />} />
          <Route path="/machines/:id" element={<MachineDetail />} />
          <Route path="/downtime" element={<Downtime />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/system" element={<SystemStatus />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<OwnerProfile />} />
        </Routes>
      </main>
    </div>
  );
}
