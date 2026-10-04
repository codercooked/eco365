import { Router } from 'express';
const router = Router();

function getTimeFilter(period) {
  const now = new Date();
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  } else if (period === 'month') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString();
  }
  // today
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

router.get('/', (req, res) => {
  const { period = 'today' } = req.query;
  const db = req.db;
  const since = getTimeFilter(period);

  // Get all events in the period
  const events = db.prepare(
    'SELECT * FROM machine_events WHERE timestamp >= ? ORDER BY machine_id, timestamp ASC'
  ).all(since);

  // Group events by machine
  const byMachine = {};
  events.forEach(e => {
    if (!byMachine[e.machine_id]) byMachine[e.machine_id] = [];
    byMachine[e.machine_id].push(e);
  });

  let totalRuntimeMs = 0;
  let totalDowntimeMs = 0;
  let totalStoppages = 0;
  let longestStoppageMs = 0;
  const now = new Date();

  const machines = db.prepare('SELECT * FROM machines').all();
  const machineMap = {};
  machines.forEach(m => { machineMap[m.id] = m; });

  const utilizationByMachine = [];

  Object.entries(byMachine).forEach(([machineId, machineEvents]) => {
    let runtimeMs = 0;
    let downtimeMs = 0;
    let stops = 0;
    let lastEvent = null;

    machineEvents.forEach(event => {
      if (event.event_type === 'STOP') {
        stops++;
        if (lastEvent && lastEvent.event_type === 'START') {
          runtimeMs += (new Date(event.timestamp) - new Date(lastEvent.timestamp));
        }
      } else if (event.event_type === 'START') {
        if (lastEvent && lastEvent.event_type === 'STOP') {
          const dt = new Date(event.timestamp) - new Date(lastEvent.timestamp);
          downtimeMs += dt;
          if (dt > longestStoppageMs) longestStoppageMs = dt;
        }
      }
      lastEvent = event;
    });

    // Handle current state
    if (lastEvent) {
      if (lastEvent.event_type === 'START') {
        runtimeMs += (now - new Date(lastEvent.timestamp));
      } else if (lastEvent.event_type === 'STOP') {
        const dt = now - new Date(lastEvent.timestamp);
        downtimeMs += dt;
        if (dt > longestStoppageMs) longestStoppageMs = dt;
      }
    }

    totalRuntimeMs += runtimeMs;
    totalDowntimeMs += downtimeMs;
    totalStoppages += stops;

    const totalMs = runtimeMs + downtimeMs;
    const utilization = totalMs > 0 ? Math.round((runtimeMs / totalMs) * 100) : 0;
    const machine = machineMap[machineId];
    utilizationByMachine.push({
      machine: machineId,
      name: machine ? machine.name : machineId,
      utilization
    });
  });

  const totalHours = (totalRuntimeMs + totalDowntimeMs) / 3600000;
  const utilization = totalHours > 0 ? Math.round((totalRuntimeMs / (totalRuntimeMs + totalDowntimeMs)) * 100) : 0;

  // RPM trend — aggregate from rpm_history
  const rpmData = db.prepare(
    'SELECT timestamp, AVG(rpm) as avgRpm FROM rpm_history WHERE timestamp >= ? AND rpm > 0 GROUP BY substr(timestamp, 1, 13) ORDER BY timestamp ASC'
  ).all(since);

  const rpmTrend = rpmData.map(r => ({
    time: r.timestamp,
    avgRpm: Math.round(r.avgRpm)
  }));

  // Sort utilization by machine name
  utilizationByMachine.sort((a, b) => a.machine.localeCompare(b.machine));

  res.json({
    totalRuntime: (totalRuntimeMs / 3600000).toFixed(1),
    totalDowntime: (totalDowntimeMs / 3600000).toFixed(1),
    utilization: utilization.toString(),
    totalStoppages,
    avgStoppageDuration: totalStoppages > 0 ? (totalDowntimeMs / totalStoppages / 60000).toFixed(1) : '0',
    longestStoppage: (longestStoppageMs / 60000).toFixed(1),
    rpmTrend,
    downtimeTrend: [],
    utilizationByMachine: utilizationByMachine.slice(0, 20) // top 20
  });
});

export default router;
