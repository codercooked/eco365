import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { formatDuration, formatTimeShort } from '../utils/format';
import './Analytics.css';

const Analytics = () => {
  const [period, setPeriod] = useState('today');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics?period=${period}`);
        if (!response.ok) throw new Error('Failed to fetch analytics data');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  if (loading && !data) {
    return <div className="analytics-loading">Loading analytics data...</div>;
  }

  return (
    <div className="analytics-container">
      <div className="page-header">
        <div className="header-titles">
          <h1>Analytics</h1>
          <div className="subtitle">Production performance metrics</div>
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

      {data && (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Total Runtime</div>
              <div className="kpi-value">{formatDuration(data.totalRuntime || 0)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Total Downtime</div>
              <div className="kpi-value">{formatDuration(data.totalDowntime || 0)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Machine Utilization</div>
              <div className="kpi-value">{(data.utilization || 0).toFixed(1)}%</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Total Stoppages</div>
              <div className="kpi-value">{data.totalStoppages || 0}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Avg Stoppage Duration</div>
              <div className="kpi-value">{formatDuration(data.avgStoppageDuration || 0)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Longest Stoppage</div>
              <div className="kpi-value">{formatDuration(data.longestStoppage || 0)}</div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-header">
                <h2>RPM Trend</h2>
              </div>
              <div className="chart-wrapper">
                {data.rpmTrend && data.rpmTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.rpmTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
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
                        labelFormatter={(val) => formatTimeShort(val)}
                        contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="avg_rpm" 
                        name="Average RPM"
                        stroke="var(--text-secondary)" 
                        fill="var(--bg-primary)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-data">No RPM trend data available.</div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h2>Utilization by Machine (%)</h2>
              </div>
              <div className="chart-wrapper">
                {data.utilizationByMachine && data.utilizationByMachine.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={data.utilizationByMachine} 
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 30, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-light)" />
                      <XAxis 
                        type="number" 
                        domain={[0, 100]}
                        stroke="var(--text-tertiary)"
                        fontSize={12}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="var(--text-tertiary)"
                        fontSize={12}
                        tickMargin={10}
                      />
                      <Tooltip 
                        cursor={{fill: 'var(--bg-primary)'}}
                        contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                        formatter={(value) => [`${value.toFixed(1)}%`, 'Utilization']}
                      />
                      <Bar dataKey="utilization" fill="var(--status-running)" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-data">No utilization data available.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
