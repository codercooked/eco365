import { API_BASE_URL } from "../config";

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchAlerts = useCallback(async (status) => {
    try {
      const url = status ? `/api/alerts?status=${status}` : '/api/alerts';
      const res = await fetch(`${API_BASE_URL}${url}`);
      const data = await res.json();
      setAlerts(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (!socket) return;
    
    const handleTriggered = (alert) => {
      setAlerts(prev => [alert, ...prev]);
    };
    
    const handleResolved = (alert) => {
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, ...alert } : a));
    };
    
    socket.on('alert-triggered', handleTriggered);
    socket.on('alert-resolved', handleResolved);
    return () => {
      socket.off('alert-triggered', handleTriggered);
      socket.off('alert-resolved', handleResolved);
    };
  }, [socket]);

  const acknowledgeAlert = async (id) => {
    await fetch(`${API_BASE_URL}/api/alerts/${id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status: 'ACKNOWLEDGED' }) });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED', acknowledged_at: new Date().toISOString() } : a));
  };

  return { alerts, loading, fetchAlerts, acknowledgeAlert };
}
