import { API_BASE_URL } from "../config";

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

export function useMachines() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchMachines = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/machines`);
      const data = await res.json();
      setMachines(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch machines:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = (updatedMachine) => {
      setMachines(prev => 
        prev.map(m => m.id === updatedMachine.id ? { ...m, ...updatedMachine } : m)
      );
    };
    
    socket.on('machine-update', handleUpdate);
    return () => socket.off('machine-update', handleUpdate);
  }, [socket]);

  return { machines, loading, refetch: fetchMachines };
}
