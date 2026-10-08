const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('./models/User');
const Room = require('./models/Room');
const Booking = require('./models/Booking');
const AuditLog = require('./models/AuditLog');
const Guest = require('./models/Guest');
const logAudit = require('./middlewares/audit.js');
const Payment = require('./models/Payment');

// ======================================================
// CONFIGURACIÓN
// ======================================================

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI no está definida en el archivo .env');
  process.exit(1);
}

// ======================================================
// APP
// ======================================================

const app = express();

app.use(cors());
app.use(express.json());

// ======================================================
// AUDITORÍA
// ======================================================

app.get('/api/audit', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// ======================================================
// USUARIOS
// ======================================================

// Obtener todos los usuarios
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();

    res.json(users);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Crear usuario
app.post('/api/users', async (req, res) => {
  try {
    const user = await User.create(req.body);

    await logAudit(
      req.body.executedBy || 'Admin',
      'ADMIN',
      `Creó usuario ${user.name} (${user.role})`
    );

    res.json(user);
  } catch (err) {
    res.status(400).json({
      error: err.message
    });
  }
});

// Actualizar usuario
app.patch('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true
      }
    );

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    await logAudit(
      req.body.executedBy || 'Admin',
      'ADMIN',
      `Actualizó estado/rol del usuario ${user.name}`
    );

    res.json(user);
  } catch (err) {
    res.status(400).json({
      error: err.message
    });
  }
});

// ======================================================
// HABITACIONES
// ======================================================

// Obtener todas las habitaciones
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find();

    res.json(rooms);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Crear habitación
app.post('/api/rooms', async (req, res) => {
  try {
    const room = await Room.create(req.body);

    await logAudit(
      req.body.executedBy || 'Admin',
      'ADMIN',
      `Creó habitación N° ${room.number}`
    );

    res.json(room);
  } catch (err) {
    res.status(400).json({
      error: err.message
    });
  }
});

// Cambiar estado de habitación
app.patch('/api/rooms/:id/status', async (req, res) => {
  try {
    const {
      status,
      user,
      role,
      reason
    } = req.body;

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      {
        status
      },
      {
        new: true
      }
    );

    if (!room) {
      return res.status(404).json({
        error: 'Habitación no encontrada'
      });
    }

    let actionText = `Marcó habitación ${room.number} como ${status}`;

    if (reason) {
      actionText += ` (Motivo: ${reason})`;
    }

    await logAudit(
      user || 'Empleado',
      role || 'STAFF',
      actionText,
      {
        reason
      }
    );

    res.json(room);
  } catch (err) {
    res.status(400).json({
      error: err.message
    });
  }
});
// GUESTS

app.get('/api/guests', async (req, res) => {
  try {
    const guests = await Guest.find().sort({ createdAt: -1 });

    res.json(guests);
  } catch (err) {
    console.error('❌ Error obteniendo huéspedes:', err);

    res.status(500).json({
      error: 'No se pudieron obtener los huéspedes',
      details: err.message
    });
  }
});

app.post('/api/guests', async (req, res) => {
  try {
    const guest = await Guest.create(req.body);

    await logAudit(
      req.body.executedBy || 'Recepción',
      req.body.role || 'RECEPTIONIST',
      `Registró huésped ${guest.name}`
    );

    res.json(guest);
  } catch (err) {
    console.error('❌ Error creando huésped:', err);

    res.status(400).json({
      error: 'No se pudo registrar el huésped',
      details: err.message
    });
  }
});

// PAYMENTS

app.get('/api/payments', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate({
        path: 'bookingId',
        populate: {
          path: 'roomId'
        }
      })
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error('❌ Error obteniendo pagos:', err);

    res.status(500).json({
      error: 'No se pudieron obtener los pagos',
      details: err.message
    });
  }
});


app.post('/api/payments', async (req, res) => {
  try {
    const {
      bookingId,
      amount,
      paymentMethod,
      receivedBy,
      role
    } = req.body;

    if (!bookingId || !amount || !paymentMethod) {
      return res.status(400).json({
        error: 'Faltan datos obligatorios para registrar el pago'
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        error: 'Reserva no encontrada'
      });
    }

    const paymentAmount = Number(amount);

    if (paymentAmount <= 0) {
      return res.status(400).json({
        error: 'El valor del pago debe ser mayor a cero'
      });
    }

    const currentPaid = Number(booking.totalPaid || 0);
    const totalAmount = Number(booking.totalAmount);

    if (currentPaid + paymentAmount > totalAmount) {
      return res.status(400).json({
        error: 'El pago supera el saldo pendiente de la reserva'
      });
    }

    const payment = await Payment.create({
      bookingId,
      amount: paymentAmount,
      paymentMethod,
      receivedBy: receivedBy || 'Recepción',
      status: 'COMPLETED'
    });

    const newTotalPaid = currentPaid + paymentAmount;

    await Booking.findByIdAndUpdate(
      bookingId,
      {
        totalPaid: newTotalPaid,
        paymentMethod
      },
      {
        returnDocument: 'after'
      }
    );

    await logAudit(
      receivedBy || 'Recepción',
      role || 'RECEPTIONIST',
      `Registró pago de $${paymentAmount} para la reserva ${booking.bookingCode}`
    );

    res.json(payment);

  } catch (err) {
    console.error('❌ Error registrando pago:', err);

    res.status(400).json({
      error: 'No se pudo registrar el pago',
      details: err.message
    });
  }
});
// ======================================================
// RESERVAS
// ======================================================

// Obtener todas las reservas
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking
      .find()
      .populate('roomId');

    res.json(bookings);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// ======================================================
// REALIZAR CHECK-IN
// ======================================================

app.patch('/api/bookings/:id/check-in', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        status: 'CHECKED_IN'
      },
      {
        returnDocument: 'after'
      }
    );

    if (!booking) {
      return res.status(404).json({
        error: 'Reserva no encontrada'
      });
    }

    // Cambiar la habitación a OCUPADA
    await Room.findByIdAndUpdate(
      booking.roomId,
      {
        status: 'OCCUPIED'
      },
      {
        returnDocument: 'after'
      }
    );

    // Registrar en auditoría
    await logAudit(
      req.body.executedBy || 'Recepción',
      req.body.role || 'RECEPTIONIST',
      `Realizó Check-In de la reserva ${booking.bookingCode}`
    );

    res.json(booking);
  } catch (err) {
    console.error('❌ Error realizando Check-In:', err);

    res.status(400).json({
      error: 'No se pudo realizar el Check-In',
      details: err.message
    });
  }
});

// ======================================================
// REALIZAR CHECK-OUT
// ======================================================

app.patch('/api/bookings/:id/check-out', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        status: 'CHECKED_OUT'
      },
      {
        returnDocument: 'after'
      }
    );

    if (!booking) {
      return res.status(404).json({
        error: 'Reserva no encontrada'
      });
    }

    // Cambiar la habitación a EN ASEO
    await Room.findByIdAndUpdate(
      booking.roomId,
      {
        status: 'CLEANING'
      },
      {
        returnDocument: 'after'
      }
    );

    // Registrar en auditoría
    await logAudit(
      req.body.executedBy || 'Recepción',
      req.body.role || 'RECEPTIONIST',
      `Realizó Check-Out de la reserva ${booking.bookingCode}`
    );

    res.json(booking);
  } catch (err) {
    console.error('❌ Error realizando Check-Out:', err);

    res.status(400).json({
      error: 'No se pudo realizar el Check-Out',
      details: err.message
    });
  }
});

// CANCELAR RESERVA
app.patch('/api/bookings/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'CANCELLED' },
      { returnDocument: 'after' }
    );

    if (!booking) {
      return res.status(404).json({
        error: 'Reserva no encontrada'
      });
    }

    // Liberar la habitación
    await Room.findByIdAndUpdate(
      booking.roomId,
      { status: 'AVAILABLE' },
      { returnDocument: 'after' }
    );

    // Registrar auditoría
    await logAudit(
      req.body.executedBy || 'Recepción',
      req.body.role || 'RECEPTIONIST',
      `Canceló la reserva ${booking.bookingCode}`
    );

    res.json(booking);
  } catch (err) {
    console.error('❌ Error cancelando reserva:', err);

    res.status(400).json({
      error: 'No se pudo cancelar la reserva',
      details: err.message
    });
  }
});

// Crear reserva
app.post('/api/bookings', async (req, res) => {
  try {
    // Crear la reserva
    const booking = await Booking.create(req.body);

    // Obtener la habitación asociada
    const targetRoomId = req.body.roomId;

    // Una reserva confirmada deja la habitación como RESERVADA
    if (targetRoomId) {
      await Room.findByIdAndUpdate(
        targetRoomId,
        {
          status: 'RESERVED'
        },
        {
          new: true
        }
      );
    }

    // Registrar acción en auditoría
    await logAudit(
      req.body.executedBy || 'Recepción',
      'RECEPTIONIST',
      `Realizó reserva ${booking.bookingCode || ''} para huésped ${req.body.guestName || ''}`
    );

    res.json(booking);
  } catch (err) {
    console.error('❌ Error guardando reserva:', err);

    res.status(400).json({
      message: 'Error al guardar reserva en base de datos',
      details: err.message
    });
  }
});

// ======================================================
// CONEXIÓN A MONGODB Y ARRANQUE DEL SERVIDOR
// ======================================================

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Conectado exitosamente a MongoDB Atlas');
    console.log('📦 Base de datos:', mongoose.connection.name);

    app.listen(PORT, () => {
      console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(
      '❌ Error conectando a MongoDB Atlas:',
      err.message
    );
  });