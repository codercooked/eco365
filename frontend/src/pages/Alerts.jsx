import React, { useState } from 'react';
import { useAlerts } from '../hooks/useAlerts';
import { formatDate, formatTime, formatDuration } from '../utils/format';
import StatusBadge from '../components/StatusBadge';
import './Alerts.css';

const Alerts = () => {
  const { alerts, loading, acknowledgeAlert } = useAlerts();
  const [filter, setFilter] = useState('ALL');

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'ALL') return true;
    return alert.status === filter;
  });

  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;

  const handleAcknowledge = async (id) => {
    await acknowledgeAlert(id);
  };

  const getAlertBorderColor = (status) => {
    switch(status) {
      case 'ACTIVE': return 'var(--status-stopped)';
      case 'ACKNOWLEDGED': return 'var(--status-idle)';
      case 'RESOLVED': return 'var(--text-tertiary)';
      default: return 'var(--border-color)';
    }
  };

  if (loading && alerts.length === 0) {
    return <div className="alerts-loading">Loading alerts...</div>;
  }

  return (
    <div className="alerts-container">
      <div className="page-header">
        <div className="header-titles">
          <h1>Alerts {activeCount > 0 && <span className="active-badge">{activeCount}</span>}</h1>
          <div className="subtitle">Machine stop notifications</div>
        </div>
      </div>

      <div className="filter-tabs">
        <button 
          className={filter === 'ALL' ? 'active' : ''} 
          onClick={() => setFilter('ALL')}
        >All</button>
        <button 
          className={filter === 'ACTIVE' ? 'active' : ''} 
          onClick={() => setFilter('ACTIVE')}
        >Active</button>
        <button 
          className={filter === 'ACKNOWLEDGED' ? 'active' : ''} 
          onClick={() => setFilter('ACKNOWLEDGED')}
        >Acknowledged</button>
        <button 
          className={filter === 'RESOLVED' ? 'active' : ''} 
          onClick={() => setFilter('RESOLVED')}
        >Resolved</button>
      </div>

      <div className="alert-list">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <div 
              key={alert.id} 
              className="alert-card"
              style={{ borderLeft: `4px solid ${getAlertBorderColor(alert.status)}` }}
            >
              <div className="alert-main">
                <div className="alert-header">
                  <span className="alert-machine">{alert.machine_id}</span>
                  <StatusBadge status={alert.status} size="small" />
                </div>
                <div className="alert-message">{alert.message}</div>
                <div className="alert-meta">
                  <span>Triggered: {formatDate(alert.triggered_at)} at {formatTime(alert.triggered_at)}</span>
                  {alert.resolved_at && (
                    <span> • Resolved: {formatDate(alert.resolved_at)} at {formatTime(alert.resolved_at)}</span>
                  )}
                  {alert.duration && (
                    <span> • Duration: {formatDuration(alert.duration)}</span>
                  )}
                </div>
              </div>
              <div className="alert-actions">
                {alert.status === 'ACTIVE' && (
                  <button 
                    className="ack-button"
                    onClick={() => handleAcknowledge(alert.id)}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-alerts">
            No {filter !== 'ALL' ? filter.toLowerCase() : ''} alerts found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
