const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('./models/User');
const Room = require('./models/Room');
const Booking = require('./models/Booking');
const AuditLog = require('./models/AuditLog');
const logAudit = require('./middlewares/audit.js');

dotenv.config();

// URI de MongoDB Atlas Corregida
const MONGO_URI = process.env.MONGO_URI || "mongodb://varelavalenciaandrea_db_user:4uIY7JPrCwsEG9ZX@ac-pd3fz8u-shard-00-00.qdoeqgx.mongodb.net:27017,ac-pd3fz8u-shard-00-01.qdoeqgx.mongodb.net:27017,ac-pd3fz8u-shard-00-02.qdoeqgx.mongodb.net:27017/hotel_pms_db?ssl=true&replicaSet=atlas-fnnhy6-shard-0&authSource=admin&appName=Cluster0";

// Conectar a la base de datos ANTES de arrancar las rutas
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectado exitosamente a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error conectando a MongoDB Atlas:', err));

const app = express();
app.use(cors());
app.use(express.json());

// --- AUDITORÍA ---
app.get('/api/audit', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- USUARIOS ---
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    await logAudit(req.body.executedBy || 'Admin', 'ADMIN', `Creó usuario ${user.name} (${user.role})`);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.id || req.params.id, req.body, { new: true });
    await logAudit(req.body.executedBy || 'Admin', 'ADMIN', `Actualizó estado/rol del usuario ${user.name}`);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- HABITACIONES ---
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const room = await Room.create(req.body);
    await logAudit(req.body.executedBy || 'Admin', 'ADMIN', `Creó habitación N° ${room.number}`);
    res.json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/rooms/:id/status', async (req, res) => {
  try {
    const { status, user, role, reason } = req.body;
    const room = await Room.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    let actionText = `Marcó habitación ${room.number} como ${status}`;
    if (reason) actionText += ` (Motivo: ${reason})`;

    await logAudit(user || 'Empleado', role || 'STAFF', actionText, { reason });
    res.json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- RESERVAS ---
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().populate('roomId');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const booking = await Booking.create(req.body);
    const targetRoomId = req.body.roomId || req.body.room;
    
    if (targetRoomId) {
      await Room.findByIdAndUpdate(targetRoomId, { status: 'OCCUPIED' });
    }
    
    await logAudit(
      req.body.executedBy || 'Recepción', 
      'RECEPTIONIST', 
      `Realizó reserva ${booking.bookingCode || ''} para huésped ${req.body.guestName || req.body.customerName}`
    );
    res.json(booking);
  } catch (err) {
    console.error("Error guardando reserva:", err);
    res.status(400).json({ message: "Error al guardar reserva en base de datos", details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor listo en http://localhost:${PORT}`));