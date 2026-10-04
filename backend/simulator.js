import { checkAlerts, resolveAlert } from './alertEngine.js';

let interval;
let historyInterval;

export function startSimulator(io, db) {
  const getMachines = db.prepare('SELECT * FROM machines');
  const updateMachine = db.prepare('UPDATE machines SET status = ?, rpm = ?, current_draw = ?, last_seen = ?, started_at = ?, stopped_at = ? WHERE id = ?');
  const insertEvent = db.prepare('INSERT INTO machine_events (machine_id, event_type, timestamp, rpm, current_draw) VALUES (?, ?, ?, ?, ?)');
  const insertHistory = db.prepare('INSERT INTO rpm_history (machine_id, rpm, current_draw, timestamp) VALUES (?, ?, ?, ?)');

  interval = setInterval(() => {
    const machines = getMachines.all();
    const now = new Date().toISOString();

    db.transaction(() => {
      machines.forEach(machine => {
        let { status, rpm, current_draw, started_at, stopped_at } = machine;
        let changed = false;

        if (status === 'RUNNING') {
          // vary RPM slightly (±5-15 from base)
          const baseRpm = 1480;
          rpm = baseRpm + (Math.random() * 30 - 15);
          current_draw = current_draw + (Math.random() * 0.6 - 0.3);
          current_draw = Math.max(5.0, Math.min(7.0, current_draw));
          changed = true;

          // Randomly change to STOPPED (0.5%)
          if (Math.random() < 0.005) {
            status = 'STOPPED';
            rpm = 0;
            current_draw = 0;
            stopped_at = now;
            insertEvent.run(machine.id, 'STOP', now, rpm, current_draw);
          }
        } else if (status === 'STOPPED' || status === 'IDLE') {
          // Randomly restart (1%)
          if (Math.random() < 0.01) {
            status = 'RUNNING';
            rpm = 1400 + Math.random() * 160;
            current_draw = 5.2 + Math.random() * 1.6;
            started_at = now;
            stopped_at = null;
            insertEvent.run(machine.id, 'START', now, rpm, current_draw);
            resolveAlert(db, io, machine.id);
          }
        }

        if (changed || status !== machine.status) {
          updateMachine.run(status, rpm, current_draw, now, started_at, stopped_at, machine.id);
          io.emit('machine-update', {
            id: machine.id,
            status,
            rpm,
            current_draw,
            last_seen: now,
            started_at,
            stopped_at
          });
        }
      });
    })();
    
    checkAlerts(db, io);
  }, 2000);

  historyInterval = setInterval(() => {
    const machines = getMachines.all();
    const now = new Date().toISOString();
    db.transaction(() => {
      machines.forEach(m => {
        insertHistory.run(m.id, m.rpm, m.current_draw, now);
      });
    })();
  }, 60000);
}
