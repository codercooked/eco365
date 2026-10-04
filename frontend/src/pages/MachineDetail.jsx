import { API_BASE_URL } from "../config";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useSocket } from '../context/SocketContext';
import {
  formatDuration,
  formatTime,
  formatTimeShort,
  formatDate,
  getTimeSince,
  statusColor,
  statusBg
} from '../utils/format';
import StatusBadge from '../components/StatusBadge';
import LiveCounter from '../components/LiveCounter';
import './MachineDetail.css';

const MachineDetail = () => {
  const { id } = useParams();
  const socket = useSocket();
  
  const [machine, setMachine] = useState(null);
  const [events, setEvents] = useState([]);
  const [rpmHistory, setRpmHistory] = useState([]);
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [machineRes, eventsRes, rpmRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/machines/${id}`),
        fetch(`${API_BASE_URL}/api/machines/${id}/events`),
        fetch(`${API_BASE_URL}/api/machines/${id}/rpm-history?period=${period}`)
      ]);

      if (!machineRes.ok) throw new Error('Failed to fetch machine details');

      const machineData = await machineRes.json();
      const eventsData = await eventsRes.json();
      const rpmData = await rpmRes.json();

      setMachine(machineData);
      setEvents(eventsData);
      setRpmHistory(rpmData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!socket || !machine) return;

    const handleMachineUpdate = (data) => {
      if (data.id === machine.id) {
        setMachine(prev => ({
          ...prev,
          ...data
        }));
      }
    };

    const handleNewEvent = (data) => {
      if (data.machine_id === machine.id) {
        setEvents(prev => [data, ...prev]);
        if (data.rpm !== undefined) {
            setRpmHistory(prev => [...prev, { timestamp: data.timestamp, rpm: data.rpm, current_draw: data.current_draw }])
        }
      }
    };

    socket.on('machine-update', handleMachineUpdate);
    socket.on('machine-event', handleNewEvent);

    return () => {
      socket.off('machine-update', handleMachineUpdate);
      socket.off('machine-event', handleNewEvent);
    };
  }, [socket, machine]);


  if (loading && !machine) {
    return <div className="machine-detail-loading">Loading machine data...</div>;
  }

  if (error) {
    return <div className="machine-detail-error">Error: {error}</div>;
  }

  if (!machine) return null;

  return (
    <div className="machine-detail-container">
      <div className="machine-detail-header">
        <Link to="/machines" className="back-link">← Machines</Link>
        <div className="title-row">
          <h1>{machine.name || machine.id}</h1>
          <StatusBadge status={machine.status} size="large" />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Current RPM</div>
          <div className="stat-value">{machine.rpm ? Number(machine.rpm).toFixed(1) : '0.0'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Current Draw</div>
          <div className="stat-value">{machine.current_draw ? `${machine.current_draw} A` : '0 A'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{machine.status === 'RUNNING' ? 'Started' : 'Stopped'} Since</div>
          <div className="stat-value">{(machine.status === 'RUNNING' ? machine.started_at : machine.stopped_at) ? formatTime(machine.status === 'RUNNING' ? machine.started_at : machine.stopped_at) : '-'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Current {machine.status === 'RUNNING' ? 'Runtime' : 'Downtime'}</div>
          <div className="stat-value">
            {(machine.status === 'RUNNING' ? machine.started_at : machine.stopped_at) ? (
              <LiveCounter since={machine.status === 'RUNNING' ? machine.started_at : machine.stopped_at} active={true} />
            ) : '-'}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Today's Runtime</div>
          <div className="stat-value">{formatDuration((machine.todayRuntime || 0) * 60000)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's Downtime</div>
          <div className="stat-value">{formatDuration((machine.todayDowntime || 0) * 60000)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Number of Stops</div>
          <div className="stat-value">{machine.stopsToday || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Longest Stop</div>
          <div className="stat-value">{formatDuration((machine.longestStop || 0) * 60000)}</div>
        </div>
      </div>

      <div className="detail-section">
        <div className="section-header">
          <h2>RPM — Today</h2>
          <div className="period-selector">
            <button 
              className={period === 'today' ? 'active' : ''} 
              onClick={() => setPeriod('today')}
            >Today</button>
            <button 
              className={period === '7d' ? 'active' : ''} 
              onClick={() => setPeriod('7d')}
            >7 Days</button>
            <button 
              className={period === '30d' ? 'active' : ''} 
              onClick={() => setPeriod('30d')}
            >30 Days</button>
          </div>
        </div>
        <div className="chart-container">
          {rpmHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rpmHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(val) => formatTimeShort(val)} 
                  stroke="var(--text-tertiary)"
                  fontSize={12}
                  tickMargin={10}
                />
                <YAxis 
                  stroke="var(--text-tertiary)" 
                  fontSize={12}
                  tickMargin={10}
                />
                <Tooltip 
                  labelFormatter={(val) => formatTime(val)}
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="rpm" 
                  stroke="var(--text-secondary)" 
                  fill="var(--bg-primary)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No RPM data available for this period.</div>
          )}
        </div>
      </div>

      <div className="detail-section">
        <div className="section-header">
          <h2>Activity Timeline</h2>
        </div>
        <div className="timeline-container">
          {events.length > 0 ? (
            <ul className="timeline">
              {events.map((event, index) => (
                <li key={index} className="timeline-item">
                  <div 
                    className="timeline-dot" 
                    style={{ backgroundColor: statusColor(event.status || (event.event_type === 'STOP' ? 'STOPPED' : 'RUNNING')) }}
                  ></div>
                  <div className="timeline-content">
                    <span className="timeline-time">{formatTimeShort(event.timestamp)}</span>
                    <span className="timeline-desc">{event.description || `${event.event_type} EVENT`}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
             <div className="no-data">No recent events.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MachineDetail;
