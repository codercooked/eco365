import { API_BASE_URL } from "../config";

import React, { useState, useEffect } from 'react';
import { getTimeSince } from '../utils/format';
import './SystemStatus.css';

const SystemStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/system/status`);
        if (!response.ok) throw new Error('Failed to fetch system status');
        const data = await response.json();
        setStatus(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching system status:', error);
        // Fallback for demo purposes if API fails
        setStatus(prev => prev || {
          status: 'ERROR',
          iotNodes: { online: 0, total: 40 },
          mqtt: 'Disconnected',
          database: 'Unknown',
          lastDataReceived: null,
          uptime: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 5000);

    return () => clearInterval(intervalId);
  }, []);

  if (loading && !status) {
    return <div className="system-loading">Loading system status...</div>;
  }

  const isHealthy = status?.status === 'HEALTHY' || status?.status === 'OK';
  
  return (
    <div className="system-container">
      <div className="page-header">
        <div className="header-titles">
          <h1>System Status</h1>
          <div className="subtitle">Infrastructure health</div>
        </div>
        <div className="overall-status">
          <div className={`status-dot ${isHealthy ? 'healthy' : 'unhealthy'}`}></div>
          <span>{isHealthy ? 'System Operational' : 'System Issues Detected'}</span>
        </div>
      </div>

      <div className="status-grid">
        <div className="status-card">
          <div className="status-label">IoT Nodes</div>
          <div className="status-value">
            {status?.iotNodes?.online || 0} / {status?.iotNodes?.total || 0} <span className="status-subtext">Online</span>
          </div>
        </div>
        <div className="status-card">
          <div className="status-label">MQTT Broker</div>
          <div className="status-value">
            <span className={status?.mqtt === 'Connected' ? 'text-healthy' : 'text-unhealthy'}>
              {status?.mqtt || 'Unknown'}
            </span>
          </div>
        </div>
        <div className="status-card">
          <div className="status-label">Database</div>
          <div className="status-value">
            <span className={status?.database === 'Healthy' ? 'text-healthy' : 'text-unhealthy'}>
              {status?.database || 'Unknown'}
            </span>
          </div>
        </div>
        <div className="status-card">
          <div className="status-label">Last Data Received</div>
          <div className="status-value">
            {status?.lastDataReceived ? getTimeSince(status.lastDataReceived) : 'Unknown'}
          </div>
        </div>
      </div>

      <div className="details-section">
        <h2>Connection Details</h2>
        <div className="table-container">
          <table className="details-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Latency</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Frontend App</td>
                <td>localhost:3000</td>
                <td><span className="badge-healthy">Online</span></td>
                <td>&lt; 5ms</td>
              </tr>
              <tr>
                <td>Backend API</td>
                <td>localhost:5001/api</td>
                <td>
                  <span className={isHealthy ? 'badge-healthy' : 'badge-unhealthy'}>
                    {isHealthy ? 'Online' : 'Unreachable'}
                  </span>
                </td>
                <td>12ms</td>
              </tr>
              <tr>
                <td>MQTT Broker</td>
                <td>mqtt://broker.emqx.io:1883</td>
                <td>
                  <span className={status?.mqtt === 'Connected' ? 'badge-healthy' : 'badge-unhealthy'}>
                    {status?.mqtt || 'Unknown'}
                  </span>
                </td>
                <td>45ms</td>
              </tr>
              <tr>
                <td>Database</td>
                <td>PostgreSQL</td>
                <td>
                  <span className={status?.database === 'Healthy' ? 'badge-healthy' : 'badge-unhealthy'}>
                    {status?.database || 'Unknown'}
                  </span>
                </td>
                <td>8ms</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="last-updated">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
