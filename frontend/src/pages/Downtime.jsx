import React, { useState, useEffect } from 'react';
import { formatDuration, formatTimeShort } from '../utils/format';
import './Downtime.css';

const Downtime = () => {
  const [period, setPeriod] = useState('today');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('totalDowntime');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchDowntime = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/downtime?period=${period}`);
        if (!response.ok) throw new Error('Failed to fetch downtime data');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching downtime:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDowntime();
  }, [period]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedMachines = () => {
    if (!data || !data.machines) return [];
    
    return [...data.machines].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  if (loading && !data) {
    return <div className="downtime-loading">Loading downtime data...</div>;
  }

  const sortedMachines = getSortedMachines();

  return (
    <div className="downtime-container">
      <div className="page-header">
        <div className="header-titles">
          <h1>Downtime Analysis</h1>
          <div className="subtitle">Production interruption tracking</div>
        </div>
        <div className="period-selector">
          <button 
            className={period === 'today' ? 'active' : ''} 
            onClick={() => setPeriod('today')}
          >Today</button>
          <button 
            className={period === 'week' ? 'active' : ''} 
            onClick={() => setPeriod('week')}
          >This Week</button>
          <button 
            className={period === 'month' ? 'active' : ''} 
            onClick={() => setPeriod('month')}
          >This Month</button>
        </div>
      </div>

      {data && data.summary && (
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">Total Downtime</div>
            <div className="summary-value">{formatDuration(data.summary.totalDowntime)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Average Downtime / Stop</div>
            <div className="summary-value">{formatDuration(data.summary.avgDowntimePerStop)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Longest Downtime</div>
            <div className="summary-value">{formatDuration(data.summary.longestDowntime)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Number of Stoppages</div>
            <div className="summary-value">{data.summary.totalStoppages}</div>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="downtime-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')}>
                Machine {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('stops')}>
                Stops {sortField === 'stops' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('totalDowntime')}>
                Total Downtime {sortField === 'totalDowntime' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('longestStop')}>
                Longest Stop {sortField === 'longestStop' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('lastStop')}>
                Last Stop {sortField === 'lastStop' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMachines.map((machine) => (
              <tr key={machine.id} className={machine.totalDowntime > 3600 ? 'high-downtime' : ''}>
                <td>{machine.name || machine.id}</td>
                <td>{machine.stops}</td>
                <td>{formatDuration(machine.totalDowntime)}</td>
                <td>{formatDuration(machine.longestStop)}</td>
                <td>{machine.lastStop ? formatTimeShort(machine.lastStop) : '-'}</td>
              </tr>
            ))}
            {sortedMachines.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-table">No downtime data for this period</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Downtime;
