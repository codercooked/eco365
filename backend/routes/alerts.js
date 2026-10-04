import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  const { status, limit = 50 } = req.query;
  const db = req.db;
  
  let query = 'SELECT * FROM alerts';
  const params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY triggered_at DESC LIMIT ?';
  params.push(parseInt(limit, 10));
  
  const alerts = db.prepare(query).all(...params);
  res.json(alerts);
});

router.patch('/:id', (req, res) => {
  const db = req.db;
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  
  if (req.body.status === 'ACKNOWLEDGED') {
    db.prepare("UPDATE alerts SET status = 'ACKNOWLEDGED', acknowledged_at = ? WHERE id = ?").run(new Date().toISOString(), req.params.id);
  }
  
  res.json({ success: true });
});

router.patch('/:id/resolve', (req, res) => {
  const db = req.db;
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  
  db.prepare("UPDATE alerts SET status = 'RESOLVED', resolved_at = ? WHERE id = ?").run(new Date().toISOString(), req.params.id);
  res.json({ success: true });
});

export default router;
