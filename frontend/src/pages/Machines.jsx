import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMachines } from '../hooks/useMachines';
import StatusBadge from '../components/StatusBadge';
import LiveCounter from '../components/LiveCounter';
import { formatTimeShort } from '../utils/format';
import './Machines.css';

export default function Machines() {
  const { machines, loading } = useMachines();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [idFilter, setIdFilter] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const filteredMachines = useMemo(() => {
    return machines
      .filter(m => statusFilter === 'ALL' || m.status === statusFilter)
      .filter(m => m.name?.toLowerCase().includes(search.toLowerCase()))
      .filter(m => m.id?.toLowerCase().includes(idFilter.toLowerCase()))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [machines, search, idFilter, statusFilter]);

  if (loading) return <div className="page-header"><h1>Loading...</h1></div>;

  return (
    <div className="machines-page">
      <header className="page-header">
        <h1>Machines</h1>
        <div className="subtitle">All cutting machines</div>
      </header>

      <div className="machines-controls">
        <input 
          type="text" 
          placeholder="Search by name..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input 
          type="text" 
          placeholder="Filter by ID..." 
          value={idFilter}
          onChange={(e) => setIdFilter(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="RUNNING">Running</option>
          <option value="STOPPED">Stopped</option>
          <option value="IDLE">Idle</option>
          <option value="OFFLINE">Offline</option>
        </select>
        <div className="view-toggle">
          <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>Table</button>
          <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>Grid</button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="table-section">
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
                      No machines match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="machines-grid">
          {filteredMachines.map(m => (
            <div key={m.id} className="machine-card" onClick={() => navigate(`/machines/${m.id}`)}>
              <div className="card-header">
                <div>
                  <div className="machine-name">{m.name}</div>
                  <div className="machine-id">{m.id}</div>
                </div>
                <StatusBadge status={m.status} size="small" />
              </div>
              <div className="card-body">
                <div className="metric">
                  <span className="metric-label">RPM</span>
                  <span className="metric-value">{m.rpm ? Number(m.rpm).toFixed(1) : '0.0'}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Current</span>
                  <span className="metric-value">{(m.current_draw || 0).toFixed(1)}A</span>
                </div>
              </div>
            </div>
          ))}
          {filteredMachines.length === 0 && (
            <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '24px', color: 'var(--text-secondary)'}}>
              No machines match the selected filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
