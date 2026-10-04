import { v4 as uuidv4 } from 'uuid';
import { sendAlert, sendResolution } from './notifier.js';

export function checkAlerts(db, io) {
  const machines = db.prepare("SELECT * FROM machines WHERE status = 'STOPPED' AND stopped_at IS NOT NULL").all();
  const now = new Date();

  machines.forEach(machine => {
    const stoppedAt = new Date(machine.stopped_at);
    const diffMins = (now - stoppedAt) / 60000;

    if (diffMins >= 5) {
      const activeAlert = db.prepare("SELECT * FROM alerts WHERE machine_id = ? AND status = 'ACTIVE'").get(machine.id);
      if (!activeAlert) {
        const alertId = uuidv4();
        const message = machine.name + ' has been stopped for ' + Math.floor(diffMins) + ' minutes.';
        db.prepare("INSERT INTO alerts (id, machine_id, triggered_at, status, message) VALUES (?, ?, ?, ?, ?)").run(alertId, machine.id, now.toISOString(), 'ACTIVE', message);

        const alertData = {
          id: alertId,
          machine_id: machine.id,
          triggered_at: now.toISOString(),
          status: 'ACTIVE',
          message
        };

        io.emit('alert-triggered', alertData);
        sendAlert(machine, alertData);
      }
    }
  });
}

export function resolveAlert(db, io, machineId) {
  const alert = db.prepare("SELECT * FROM alerts WHERE machine_id = ? AND status = 'ACTIVE'").get(machineId);
  const machine = db.prepare("SELECT * FROM machines WHERE id = ?").get(machineId);

  if (alert && machine) {
    const now = new Date();
    db.prepare("UPDATE alerts SET status = 'RESOLVED', resolved_at = ? WHERE id = ?").run(now.toISOString(), alert.id);

    io.emit('alert-resolved', {
      id: alert.id,
      machine_id: machineId,
      status: 'RESOLVED',
      resolved_at: now.toISOString()
    });

    const stoppedAt = new Date(machine.stopped_at || alert.triggered_at);
    const diffMs = now - stoppedAt;
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    const downtimeStr = mins + 'm ' + secs + 's';

    sendResolution(machine, downtimeStr);
  }
}
