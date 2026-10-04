import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initDb, getDb } from './db.js';
import { startSimulator } from './simulator.js';
import machinesRouter from './routes/machines.js';
import alertsRouter from './routes/alerts.js';
import analyticsRouter from './routes/analytics.js';
import downtimeRouter from './routes/downtime.js';
import systemRouter from './routes/system.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], methods: ['GET', 'POST', 'PATCH'] }
});

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

// Make io and db available to routes
app.use((req, res, next) => {
  req.io = io;
  req.db = getDb();
  next();
});

app.use('/api/machines', machinesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/downtime', downtimeRouter);
app.use('/api/system', systemRouter);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// Initialize DB (async for sql.js), then start simulator and server
async function start() {
  await initDb();
  startSimulator(io, getDb());

  server.listen(3001, () => {
    console.log('Eco365 Machine Monitor API running on port 3001');
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
