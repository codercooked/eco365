import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMachines } from '../hooks/useMachines';
import StatusBadge from '../components/StatusBadge';
import LiveCounter from '../components/LiveCounter';
import { formatTimeShort } from '../utils/format';
import './Overview.css';

export default function Overview() {
  const { machines, loading } = useMachines();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState('name');

  const counts = useMemo(() => {
    const res = { RUNNING: 0, STOPPED: 0, IDLE: 0, OFFLINE: 0, TOTAL: machines.length };
    machines.forEach(m => res[m.status] = (res[m.status] || 0) + 1);
    return res;
  }, [machines]);

  const filteredMachines = useMemo(() => {
    return machines
      .filter(m => statusFilter === 'ALL' || m.status === statusFilter)
      .filter(m => m.name?.toLowerCase().includes(search.toLowerCase()) || m.id?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sortConfig === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortConfig === 'rpm') return (b.rpm || 0) - (a.rpm || 0);
        if (sortConfig === 'status') return (a.status || '').localeCompare(b.status || '');
        if (sortConfig === 'downtime') {
          const aTime = a.last_status_change ? new Date(a.last_status_change).getTime() : Date.now();
          const bTime = b.last_status_change ? new Date(b.last_status_change).getTime() : Date.now();
          return aTime - bTime;
        }
        return 0;
      });
  }, [machines, search, statusFilter, sortConfig]);

  if (loading) return <div className="page-header"><h1>Loading...</h1></div>;

  return (
    <div className="overview-page">
      <header className="page-header">
        <h1>Machine Overview</h1>
        <div className="subtitle">Live production monitoring</div>
      </header>

      <section className="kpi-section">
        <h2 className="kpi-title">{counts.TOTAL} Machines</h2>
        <div className="kpi-grid">
          <div className="kpi-card" style={{borderLeftColor: 'var(--status-running)'}}>
            <div className="kpi-label">Running</div>
            <div className="kpi-value">{counts.RUNNING}</div>
          </div>
          <div className="kpi-card" style={{borderLeftColor: 'var(--status-stopped)'}}>
            <div className="kpi-label">Stopped</div>
            <div className="kpi-value">{counts.STOPPED}</div>
          </div>
          <div className="kpi-card" style={{borderLeftColor: 'var(--status-idle)'}}>
            <div className="kpi-label">Idle</div>
            <div className="kpi-value">{counts.IDLE}</div>
          </div>
          <div className="kpi-card" style={{borderLeftColor: 'var(--status-offline)'}}>
            <div className="kpi-label">Offline</div>
            <div className="kpi-value">{counts.OFFLINE}</div>
          </div>
        </div>
      </section>

      <section className="table-section">
        <div className="table-header">
          <h2>All Machines</h2>
          <div className="table-controls">
            <input 
              type="text" 
              placeholder="Search machine..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Status</option>
              <option value="RUNNING">Running</option>
              <option value="STOPPED">Stopped</option>
              <option value="IDLE">Idle</option>
              <option value="OFFLINE">Offline</option>
            </select>
            <select value={sortConfig} onChange={(e) => setSortConfig(e.target.value)}>
              <option value="name">Sort by Name</option>
              <option value="rpm">Sort by RPM</option>
              <option value="status">Sort by Status</option>
              <option value="downtime">Sort by Downtime</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Machine</th>
                <th>Status</th>
                <th>RPM</th>
                <th>Current</th>
                <th>Since</th>
                <th>Downtime</th>
              </tr>
            </thead>
            <tbody>
              {filteredMachines.map(m => (
                <tr key={m.id} onClick={() => navigate(`/machines/${m.id}`)} style={{cursor: 'pointer'}}>
                  <td>
                    <div className="machine-name">{m.name}</div>
                    <div className="machine-id">{m.id}</div>
                  </td>
                  <td><StatusBadge status={m.status} /></td>
                  <td>{m.rpm ? Number(m.rpm).toFixed(1) : '0.0'} RPM</td>
                  <td>{(m.current_draw || 0).toFixed(1)}A</td>
                  <td>{m.status !== 'RUNNING' && m.status !== 'OFFLINE' ? formatTimeShort(m.stopped_at) : '—'}</td>
                  <td>
                    {m.status === 'STOPPED' || m.status === 'IDLE' 
                      ? <LiveCounter since={m.stopped_at} />
                      : '—'}
                  </td>
                </tr>
              ))}
              {filteredMachines.length === 0 && (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '24px', color: 'var(--text-secondary)'}}>
                    No machines found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
