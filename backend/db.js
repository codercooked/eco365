import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const DB_PATH = 'eco365.db';
let db;

// Compatibility wrapper that mimics better-sqlite3 API surface
class DatabaseWrapper {
  constructor(sqlDb) {
    this._db = sqlDb;
  }

  prepare(sql) {
    const self = this;
    return {
      all(...params) {
        try {
          const stmt = self._db.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          const results = [];
          while (stmt.step()) {
            const row = stmt.getAsObject();
            results.push(row);
          }
          stmt.free();
          return results;
        } catch (e) {
          console.error('SQL error in .all():', sql, params, e.message);
          return [];
        }
      },
      get(...params) {
        try {
          const stmt = self._db.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          let result = null;
          if (stmt.step()) {
            result = stmt.getAsObject();
          }
          stmt.free();
          return result;
        } catch (e) {
          console.error('SQL error in .get():', sql, params, e.message);
          return null;
        }
      },
      run(...params) {
        try {
          self._db.run(sql, params);
        } catch (e) {
          console.error('SQL error in .run():', sql, params, e.message);
        }
      }
    };
  }

  exec(sql) {
    try {
      this._db.run(sql);
    } catch (e) {
      console.error('SQL exec error:', e.message);
    }
  }

  transaction(fn) {
    const self = this;
    return function (...args) {
      self._db.run('BEGIN TRANSACTION');
      try {
        fn.apply(null, args);
        self._db.run('COMMIT');
      } catch (e) {
        self._db.run('ROLLBACK');
        throw e;
      }
    };
  }

  save() {
    const data = this._db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  }
}

export function getDb() {
  return db;
}

export async function initDb() {
  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    db = new DatabaseWrapper(new SQL.Database(fileBuffer));
  } else {
    db = new DatabaseWrapper(new SQL.Database());
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS machines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT DEFAULT 'Production Floor',
      status TEXT DEFAULT 'RUNNING',
      rpm REAL DEFAULT 0,
      current_draw REAL DEFAULT 0,
      last_seen TEXT,
      started_at TEXT,
      stopped_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS machine_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      rpm REAL DEFAULT 0,
      current_draw REAL DEFAULT 0,
      FOREIGN KEY (machine_id) REFERENCES machines(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      machine_id TEXT NOT NULL,
      triggered_at TEXT NOT NULL,
      threshold INTEGER DEFAULT 300,
      status TEXT DEFAULT 'ACTIVE',
      acknowledged_at TEXT,
      resolved_at TEXT,
      message TEXT,
      FOREIGN KEY (machine_id) REFERENCES machines(id)
    );

    CREATE TABLE IF NOT EXISTS rpm_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id TEXT NOT NULL,
      rpm REAL NOT NULL,
      current_draw REAL NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (machine_id) REFERENCES machines(id)
    );
  `);

  const count = db.prepare('SELECT COUNT(*) as count FROM machines').get();
  if (!count || count.count === 0) {
    seedMachines();
  }

  // Save periodically
  setInterval(() => {
    try { db.save(); } catch (e) { /* ignore */ }
  }, 30000);
}

function seedMachines() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(6, 0, 0, 0); // Start from 6 AM

  const insertMachine = db.prepare(
    'INSERT INTO machines (id, name, location, status, rpm, current_draw, last_seen, started_at, stopped_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertEvent = db.prepare(
    'INSERT INTO machine_events (machine_id, event_type, timestamp, rpm, current_draw) VALUES (?, ?, ?, ?, ?)'
  );
  const insertHistory = db.prepare(
    'INSERT INTO rpm_history (machine_id, rpm, current_draw, timestamp) VALUES (?, ?, ?, ?)'
  );

  const locations = ['Production Floor A', 'Production Floor B', 'Production Floor C', 'Production Floor D'];

  db.transaction(() => {
    for (let i = 1; i <= 40; i++) {
      const id = `CUT-${i.toString().padStart(2, '0')}`;
      const name = `Cutting Machine ${i.toString().padStart(2, '0')}`;
      const location = locations[Math.floor((i - 1) / 10)];
      let status, rpm, currentDraw, startedAt, stoppedAt;
      const lastSeen = now.toISOString();

      if (i <= 33) {
        // Running machines with varied RPMs
        status = 'RUNNING';
        const baseRpms = [1420, 1445, 1460, 1478, 1490, 1502, 1515, 1530, 1545, 1555];
        rpm = baseRpms[i % baseRpms.length] + (Math.random() * 20 - 10);
        currentDraw = 5.2 + (i % 7) * 0.2 + (Math.random() * 0.3);
        startedAt = new Date(now.getTime() - (1 + Math.random() * 5) * 3600000).toISOString();
        stoppedAt = null;
      } else if (i === 34) {
        // Recently restarted machine
        status = 'RUNNING';
        rpm = 1488 + Math.random() * 10;
        currentDraw = 5.9;
        startedAt = new Date(now.getTime() - 180000).toISOString(); // 3 mins ago
        stoppedAt = null;
      } else if (i >= 35 && i <= 37) {
        // Stopped machines (varied stop times)
        status = 'STOPPED';
        rpm = 0;
        currentDraw = 0;
        startedAt = null;
        const stopTimes = [17 * 60000, 42 * 60000, 8 * 60000]; // 17m, 42m, 8m ago
        stoppedAt = new Date(now.getTime() - stopTimes[i - 35]).toISOString();
      } else if (i === 38) {
        // Stopped for more than 5 minutes (will trigger alert)
        status = 'STOPPED';
        rpm = 0;
        currentDraw = 0;
        startedAt = null;
        stoppedAt = new Date(now.getTime() - 25 * 60000).toISOString(); // 25 mins ago
      } else if (i === 39) {
        // Idle machine
        status = 'IDLE';
        rpm = 0;
        currentDraw = 4.2;
        startedAt = null;
        stoppedAt = new Date(now.getTime() - 4 * 60000).toISOString(); // 4 mins ago
      } else {
        // Offline machine (IoT device disconnected)
        status = 'OFFLINE';
        rpm = 0;
        currentDraw = 0;
        startedAt = null;
        stoppedAt = null;
      }

      insertMachine.run(id, name, location, status, rpm, currentDraw, lastSeen, startedAt, stoppedAt);

      // Generate realistic event history for today
      let eventTime = new Date(todayStart.getTime() + Math.random() * 1800000);
      let machineRunning = true;
      const eventRpm = () => 1400 + Math.random() * 160;
      const eventCurrent = () => 5.2 + Math.random() * 1.6;

      // Start event
      insertEvent.run(id, 'START', eventTime.toISOString(), eventRpm(), eventCurrent());

      while (eventTime < now) {
        // Run for 30min - 3h
        const runDuration = (30 + Math.random() * 150) * 60000;
        eventTime = new Date(eventTime.getTime() + runDuration);
        if (eventTime >= now) break;

        // Stop
        machineRunning = false;
        insertEvent.run(id, 'STOP', eventTime.toISOString(), 0, 0);

        // Stay stopped for 3-30 minutes
        const stopDuration = (3 + Math.random() * 27) * 60000;
        eventTime = new Date(eventTime.getTime() + stopDuration);
        if (eventTime >= now) break;

        // Restart
        machineRunning = true;
        insertEvent.run(id, 'START', eventTime.toISOString(), eventRpm(), eventCurrent());
      }

      // Generate RPM history every 5 minutes for today
      for (let time = new Date(todayStart); time <= now; time = new Date(time.getTime() + 300000)) {
        let hRpm = 0;
        let hCurrent = 0;

        if (status === 'RUNNING') {
          hRpm = 1400 + Math.random() * 160;
          hCurrent = 5.2 + Math.random() * 1.6;
        } else if (status === 'STOPPED' && stoppedAt && time < new Date(stoppedAt)) {
          hRpm = 1400 + Math.random() * 160;
          hCurrent = 5.2 + Math.random() * 1.6;
        } else if (status === 'IDLE') {
          hRpm = 0;
          hCurrent = 3.5 + Math.random() * 1.0;
        }

        insertHistory.run(id, hRpm, hCurrent, time.toISOString());
      }
    }
  })();

  // Save after seeding
  db.save();
  console.log('Seeded 40 machines with event history and RPM data.');
}
