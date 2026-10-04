import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  const { status, search, sort, order } = req.query;
  const db = req.db;

  let query = 'SELECT * FROM machines WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (name LIKE ? OR id LIKE ?)';
    params.push('%' + search + '%');
    params.push('%' + search + '%');
  }

  const allowedSorts = ['rpm', 'name', 'status', 'stopped_at'];
  if (sort && allowedSorts.includes(sort)) {
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';
    query += ' ORDER BY ' + sort + ' ' + sortOrder;
  } else {
    query += ' ORDER BY id ASC';
  }

  const machines = db.prepare(query).all(...params);
  res.json(machines);
});

router.get('/:id', (req, res) => {
  const db = req.db;
  const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(req.params.id);
  if (!machine) return res.status(404).json({ error: 'Machine not found' });

  // Get today's start
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const events = db.prepare(
    'SELECT * FROM machine_events WHERE machine_id = ? AND timestamp >= ? ORDER BY timestamp ASC'
  ).all(machine.id, todayStart.toISOString());

  let todayRuntimeMs = 0;
  let todayDowntimeMs = 0;
  let stopsToday = 0;
  let longestStopMs = 0;

  let lastEvent = null;
  const now = new Date();

  events.forEach(event => {
    if (event.event_type === 'STOP') {
      stopsToday++;
      if (lastEvent && lastEvent.event_type === 'START') {
        todayRuntimeMs += (new Date(event.timestamp) - new Date(lastEvent.timestamp));
      }
    } else if (event.event_type === 'START') {
      if (lastEvent && lastEvent.event_type === 'STOP') {
        const downtime = new Date(event.timestamp) - new Date(lastEvent.timestamp);
        todayDowntimeMs += downtime;
        if (downtime > longestStopMs) longestStopMs = downtime;
      }
    }
    lastEvent = event;
  });

  if (lastEvent) {
    if (lastEvent.event_type === 'START') {
      todayRuntimeMs += (now - new Date(lastEvent.timestamp));
    } else if (lastEvent.event_type === 'STOP') {
      const downtime = now - new Date(lastEvent.timestamp);
      todayDowntimeMs += downtime;
      if (downtime > longestStopMs) longestStopMs = downtime;
    }
  }

  res.json({
    ...machine,
    todayRuntime: Math.round(todayRuntimeMs / 60000),
    todayDowntime: Math.round(todayDowntimeMs / 60000),
    stopsToday,
    longestStop: Math.round(longestStopMs / 60000)
  });
});

router.get('/:id/events', (req, res) => {
  const { from, to } = req.query;
  const db = req.db;

  let query = 'SELECT * FROM machine_events WHERE machine_id = ?';
  const params = [req.params.id];

  if (from) {
    query += ' AND timestamp >= ?';
    params.push(from);
  } else {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    query += ' AND timestamp >= ?';
    params.push(todayStart.toISOString());
  }
  if (to) {
    query += ' AND timestamp <= ?';
    params.push(to);
  }

  query += ' ORDER BY timestamp DESC';
  const events = db.prepare(query).all(...params);
  res.json(events);
});

router.get('/:id/rpm-history', (req, res) => {
  const { period } = req.query;
  const db = req.db;

  let since;
  const now = new Date();
  if (period === '7d') {
    since = new Date(now.getTime() - 7 * 24 * 3600000);
  } else if (period === '30d') {
    since = new Date(now.getTime() - 30 * 24 * 3600000);
  } else {
    since = new Date(now);
    since.setHours(0, 0, 0, 0);
  }

  const history = db.prepare(
    'SELECT * FROM rpm_history WHERE machine_id = ? AND timestamp >= ? ORDER BY timestamp ASC'
  ).all(req.params.id, since.toISOString());
  res.json(history);
});

export default router;
