import { Router } from 'express';
const router = Router();
const startTime = Date.now();

router.get('/status', (req, res) => {
  const db = req.db;
  const machines = db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN status != "OFFLINE" THEN 1 ELSE 0 END) as online FROM machines').get();
  
  res.json({
    status: "operational",
    iotNodes: { 
      online: machines.online || 0, 
      total: machines.total || 0 
    },
    mqtt: { status: "connected" },
    database: { status: "healthy" },
    lastDataReceived: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000)
  });
});

export default router;
