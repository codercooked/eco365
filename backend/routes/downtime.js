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
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

router.get('/', (req, res) => {
  const { period = 'today' } = req.query;
  const db = req.db;
  const since = getTimeFilter(period);

  const events = db.prepare(
    'SELECT * FROM machine_events WHERE timestamp >= ? ORDER BY machine_id, timestamp ASC'
  ).all(since);

  // Group events by machine
  const byMachine = {};
  events.forEach(e => {
    if (!byMachine[e.machine_id]) byMachine[e.machine_id] = [];
    byMachine[e.machine_id].push(e);
  });

  const machines = db.prepare('SELECT * FROM machines').all();
  const machineMap = {};
  machines.forEach(m => { machineMap[m.id] = m; });

  let globalTotalDowntimeMs = 0;
  let globalTotalStoppages = 0;
  let globalLongestDowntimeMs = 0;
  const now = new Date();
  const machineDowntime = [];

  // Process each machine
  machines.forEach(machine => {
    const machineEvents = byMachine[machine.id] || [];
    let downtimeMs = 0;
    let stops = 0;
    let longestStopMs = 0;
    let lastStop = null;
    let lastEvent = null;

    machineEvents.forEach(event => {
      if (event.event_type === 'STOP') {
        stops++;
        lastStop = event.timestamp;
      } else if (event.event_type === 'START') {
        if (lastEvent && lastEvent.event_type === 'STOP') {
          const dt = new Date(event.timestamp) - new Date(lastEvent.timestamp);
          downtimeMs += dt;
          if (dt > longestStopMs) longestStopMs = dt;
        }
      }
      lastEvent = event;
    });

    // If currently stopped, add ongoing downtime
    if (lastEvent && lastEvent.event_type === 'STOP') {
      const dt = now - new Date(lastEvent.timestamp);
      downtimeMs += dt;
      if (dt > longestStopMs) longestStopMs = dt;
    }

    // Also account for machines currently stopped without events today
    if (stops === 0 && machine.status === 'STOPPED' && machine.stopped_at) {
      const stoppedAt = new Date(machine.stopped_at);
      if (stoppedAt >= new Date(since)) {
        stops = 1;
        downtimeMs = now - stoppedAt;
        longestStopMs = downtimeMs;
        lastStop = machine.stopped_at;
      }
    }

    if (stops > 0 || downtimeMs > 0) {
      machineDowntime.push({
        id: machine.id,
        name: machine.name,
        stops,
        totalDowntime: Math.round(downtimeMs / 60000),
        longestStop: Math.round(longestStopMs / 60000),
        lastStop: lastStop || machine.stopped_at
      });
    }

    globalTotalDowntimeMs += downtimeMs;
    globalTotalStoppages += stops;
    if (longestStopMs > globalLongestDowntimeMs) globalLongestDowntimeMs = longestStopMs;
  });

  // Sort by total downtime descending
  machineDowntime.sort((a, b) => b.totalDowntime - a.totalDowntime);

  const avgPerStop = globalTotalStoppages > 0
    ? Math.round(globalTotalDowntimeMs / globalTotalStoppages / 60000)
    : 0;

  res.json({
    summary: {
      totalDowntime: Math.round(globalTotalDowntimeMs / 60000).toString(),
      avgDowntimePerStop: avgPerStop.toString(),
      longestDowntime: Math.round(globalLongestDowntimeMs / 60000).toString(),
      totalStoppages: globalTotalStoppages.toString()
    },
    machines: machineDowntime
  });
});

export default router;
