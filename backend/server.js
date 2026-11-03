const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Room = require('./models/Room');
const Booking = require('./models/Booking');
const AuditLog = require('./models/AuditLog');
const Guest = require('./models/Guest');
const logAudit = require('./middlewares/audit.js');
const Payment = require('./models/Payment');
const Incident = require('./models/Incident');
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
    const { start, end } = req.query;

    const filters = {};

    // Filtrar desde una fecha y hora inicial.
    if (start) {
      const startDate = new Date(start);

      if (Number.isNaN(startDate.getTime())) {
        return res.status(400).json({
          error: 'La fecha y hora inicial no son válidas.'
        });
      }

      filters.timestamp = {
        ...filters.timestamp,
        $gte: startDate
      };
    }

    // Filtrar hasta una fecha y hora final.
    if (end) {
      const endDate = new Date(end);

      if (Number.isNaN(endDate.getTime())) {
        return res.status(400).json({
          error: 'La fecha y hora final no son válidas.'
        });
      }

      filters.timestamp = {
        ...filters.timestamp,
        $lte: endDate
      };
    }

    // Validar que el rango tenga sentido.
    if (
      start &&
      end &&
      new Date(start) > new Date(end)
    ) {
      return res.status(400).json({
        error: 'La fecha inicial no puede ser posterior a la fecha final.'
      });
    }

    const logs = await AuditLog.find(filters)
      .sort({ timestamp: -1 });

    return res.json(logs);

  } catch (err) {
    console.error('Error consultando auditoría:', err);

    return res.status(500).json({
      error: 'No se pudo consultar el historial de auditoría.',
      details: err.message
    });
  }
});


// ======================================================
// AUTENTICACIÓN
// ======================================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos obligatorios
    if (!email || !password) {
      return res.status(400).json({
        error: 'El correo y la contraseña son obligatorios.'
      });
    }

    // Buscar empleado por correo
    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    // Comprobar que el empleado exista
    if (!user) {
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos.'
      });
    }

    // Comprobar que el empleado esté activo
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Tu cuenta está desactivada. Contacta al administrador.'
      });
    }

    // Verificar contraseña con bcrypt
    const passwordIsValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos.'
      });
    }

    // Verificar que exista la clave secreta
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: 'La configuración de autenticación está incompleta.'
      });
    }

    // Generar token de autenticación
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Responder sin exponer la contraseña
    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Error en el inicio de sesión:', err);

    return res.status(500).json({
      error: 'No se pudo iniciar sesión.'
    });
  }
});


// ======================================================
// USUARIOS
// ======================================================

// Obtener todos los usuarios (sin exponer contraseñas)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    return res.status(200).json(users);
  } catch (err) {
    console.error('Error obteniendo usuarios:', err);

    return res.status(500).json({
      error: 'No se pudieron obtener los usuarios.',
      details: err.message
    });
  }
});


// Crear un nuevo usuario
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, role, executedBy } = req.body;

    // Validar campos obligatorios
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: 'Todos los campos son obligatorios.'
      });
    }

    // Validar roles permitidos
    const allowedRoles = [
      'ADMIN',
      'RECEPTIONIST',
      'HOUSEKEEPING',
      'MANAGER'
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        error: 'El rol seleccionado no es válido.'
      });
    }

    // Comprobar si el correo ya existe
    const existingUser = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Ya existe un usuario registrado con ese correo.'
      });
    }

    // Proteger la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role
    });

    // Registrar acción en auditoría
    await logAudit(
      executedBy || 'Admin Principal',
      'ADMIN',
      `Creó usuario ${user.name} (${user.role})`
    );

    // Consultar usuario sin contraseña
    const safeUser = await User.findById(user._id)
      .select('-password');

    return res.status(201).json({
      message: 'Usuario creado correctamente.',
      user: safeUser
    });

  } catch (err) {
    console.error('Error creando usuario:', err);

    return res.status(400).json({
      error: 'No se pudo crear el usuario.',
      details: err.message
    });
  }
});


// Actualizar rol o estado de un usuario

app.patch('/api/users/:id', async (req, res) => {
  try {
    const { name, email, role, isActive, executedBy } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'Empleado no encontrado.'
      });
    }

    const allowedRoles = [
      'ADMIN',
      'RECEPTIONIST',
      'HOUSEKEEPING',
      'MANAGER'
    ];

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          error: 'El nombre no puede estar vacío.'
        });
      }

      user.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          error: 'El correo no puede estar vacío.'
        });
      }

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id }
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Ese correo ya está registrado.'
        });
      }

      user.email = normalizedEmail;
    }

    if (role !== undefined) {
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          error: 'El rol seleccionado no es válido.'
        });
      }

      user.role = role;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          error: 'El estado debe ser verdadero o falso.'
        });
      }

      user.isActive = isActive;
    }

    await user.save();

    await logAudit(
      executedBy || 'Admin Principal',
      'ADMIN',
      `Actualizó al empleado ${user.name}. Rol: ${user.role}. Estado: ${
        user.isActive ? 'Activo' : 'Inactivo'
      }`
    );

    const safeUser = await User.findById(user._id).select('-password');

    return res.json({
      message: 'Empleado actualizado correctamente.',
      user: safeUser
    });

  } catch (err) {
    console.error('Error actualizando empleado:', err);

    return res.status(400).json({
      error: 'No se pudo actualizar el empleado.',
      details: err.message
    });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { executedBy } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'Empleado no encontrado.'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    await logAudit(
      executedBy || 'Admin Principal',
      'ADMIN',
      `Eliminó al empleado ${user.name} (${user.role})`
    );

    return res.json({
      message: 'Empleado eliminado correctamente.'
    });

  } catch (err) {
    console.error('Error eliminando empleado:', err);

    return res.status(500).json({
      error: 'No se pudo eliminar el empleado.',
      details: err.message
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


app.patch('/api/rooms/:id', async (req, res) => {
  try {
    const { number, type, capacity, pricePerNight, executedBy } = req.body;

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        error: 'Habitación no encontrada.'
      });
    }

    if (number !== undefined) {
      if (!String(number).trim()) {
        return res.status(400).json({
          error: 'El número de habitación es obligatorio.'
        });
      }

      room.number = String(number).trim();
    }

    if (type !== undefined) room.type = type;

    if (capacity !== undefined) {
      const parsedCapacity = Number(capacity);

      if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
        return res.status(400).json({
          error: 'La capacidad debe ser un número entero mayor que cero.'
        });
      }

      room.capacity = parsedCapacity;
    }

    if (pricePerNight !== undefined) {
      const parsedPrice = Number(pricePerNight);

      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          error: 'El precio por noche no es válido.'
        });
      }

      room.pricePerNight = parsedPrice;
    }

    await room.save();

    await logAudit(
      executedBy || 'Admin Principal',
      'ADMIN',
      `Actualizó la habitación ${room.number}`
    );

    return res.json({
      message: 'Habitación actualizada correctamente.',
      room
    });

  } catch (err) {
    console.error('Error actualizando habitación:', err);

    return res.status(400).json({
      error: 'No se pudo actualizar la habitación.',
      details: err.message
    });
  }
});


app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const { executedBy } = req.body;

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        error: 'Habitación no encontrada.'
      });
    }

    // Evitar eliminar habitaciones con reservas históricas.
    const hasBookings = await Booking.exists({
      roomId: room._id
    });

    if (hasBookings) {
      return res.status(409).json({
        error: 'No se puede eliminar esta habitación porque tiene reservas asociadas.'
      });
    }

    await Room.findByIdAndDelete(req.params.id);

    await logAudit(
      executedBy || 'Admin Principal',
      'ADMIN',
      `Eliminó la habitación ${room.number}`
    );

    return res.json({
      message: 'Habitación eliminada correctamente.'
    });

  } catch (err) {
    console.error('Error eliminando habitación:', err);

    return res.status(500).json({
      error: 'No se pudo eliminar la habitación.',
      details: err.message
    });
  }
});

// Cambiar estado de habitación
app.patch('/api/rooms/:id/status', async (req, res) => {
  try {
    const { status, user, role, reason } = req.body;

    const allowedStatuses = [
      'AVAILABLE',
      'CLEANING',
      'OCCUPIED',
      'RESERVED',
      'OUT_OF_SERVICE'
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'El estado de habitación no es válido.'
      });
    }

    const existingRoom = await Room.findById(req.params.id);

    if (!existingRoom) {
      return res.status(404).json({
        error: 'Habitación no encontrada.'
      });
    }

    // El personal de aseo no puede habilitar directamente
    // una habitación que continúa fuera de servicio.
    if (
      role === 'HOUSEKEEPING' &&
      existingRoom.status === 'OUT_OF_SERVICE' &&
      status === 'AVAILABLE'
    ) {
      return res.status(403).json({
        error:
          'La habitación debe ser revisada y reparada antes de habilitarse.'
      });
    }

    existingRoom.status = status;
    const room = await existingRoom.save();

    let actionText = `Marcó habitación ${room.number} como ${status}`;

    if (reason) {
      actionText += ` (Motivo: ${reason})`;
    }

    await logAudit(
      user || 'Empleado',
      role || 'STAFF',
      actionText,
      { reason }
    );

    return res.json(room);
  } catch (err) {
    console.error('Error al cambiar estado de habitación:', err);

    return res.status(400).json({
      error: err.message
    });
  }
});
// ===============================
// GUESTS
// ===============================

// Obtener todos los huéspedes
app.get('/api/guests', async (req, res) => {
  try {
    const guests = await Guest.find().sort({ createdAt: -1 });

    return res.json(guests);
  } catch (err) {
    console.error('❌ Error obteniendo huéspedes:', err);

    return res.status(500).json({
      error: 'No se pudieron obtener los huéspedes.',
      details: err.message
    });
  }
});


// Actualizar información de un huésped
app.patch('/api/guests/:id', async (req, res) => {
  try {
    const {
      name,
      document,
      email,
      phone,
      isActive,
      executedBy,
      role
    } = req.body;

    const guest = await Guest.findById(req.params.id);

    if (!guest) {
      return res.status(404).json({
        error: 'Huésped no encontrado.'
      });
    }

    // Actualizar nombre
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          error: 'El nombre no puede estar vacío.'
        });
      }

      guest.name = name.trim();
    }

    // Actualizar documento
    if (document !== undefined) {
      if (typeof document !== 'string' || !document.trim()) {
        return res.status(400).json({
          error: 'El documento no puede estar vacío.'
        });
      }

      guest.document = document.trim();
    }

    // Actualizar correo
    if (email !== undefined) {
      if (typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({
          error: 'El correo electrónico no puede estar vacío.'
        });
      }

      guest.email = email.trim().toLowerCase();
    }

    // Actualizar teléfono
    if (phone !== undefined) {
      guest.phone = typeof phone === 'string' ? phone.trim() : phone;
    }

    // Activar o desactivar huésped
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          error: 'El estado debe ser verdadero o falso.'
        });
      }

      guest.isActive = isActive;
    }

    await guest.save();

    await logAudit(
      executedBy || 'Admin Principal',
      role || 'ADMIN',
      `Actualizó los datos del huésped ${guest.name}`
    );

    return res.json({
      message: 'Huésped actualizado correctamente.',
      guest
    });

  } catch (err) {
    console.error('❌ Error actualizando huésped:', err);

    if (err.code === 11000) {
      return res.status(409).json({
        error: 'Ya existe un huésped registrado con ese documento.'
      });
    }

    return res.status(400).json({
      error: 'No se pudo actualizar el huésped.',
      details: err.message
    });
  }
});


// Eliminar huésped (desactivación lógica)
app.delete('/api/guests/:id', async (req, res) => {
  try {
    const { executedBy, role } = req.body;

    const guest = await Guest.findById(req.params.id);

    if (!guest) {
      return res.status(404).json({
        error: 'Huésped no encontrado.'
      });
    }

    if (!guest.isActive) {
      return res.status(400).json({
        error: 'Este huésped ya se encuentra inactivo.'
      });
    }

    // Verificar si el huésped tiene reservas asociadas
    const hasBookings = await Booking.exists({
      $or: [
        { guestId: guest._id },
        { guestDocument: guest.document }
      ]
    });

    // No eliminar físicamente los huéspedes con reservas
    // Se conserva su historial mediante desactivación
    guest.isActive = false;

    await guest.save();

    await logAudit(
      executedBy || 'Admin Principal',
      role || 'ADMIN',
      hasBookings
        ? `Desactivó al huésped ${guest.name}, conservando su historial de reservas`
        : `Desactivó el registro del huésped ${guest.name}`
    );

    return res.json({
      message: hasBookings
        ? 'Huésped desactivado. Su historial de reservas se conserva.'
        : 'Huésped desactivado correctamente.',
      guest
    });

  } catch (err) {
    console.error('❌ Error desactivando huésped:', err);

    return res.status(500).json({
      error: 'No se pudo desactivar el huésped.',
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
 // INCIDENCIAS Y REPORTES DE DAÑOS
 // ======================================================

// Obtener incidencias
app.get('/api/incidents', async (req, res) => {
  try {
    const { status, roomId } = req.query;
    const filters = {};

    if (status) {
      filters.status = status;
    }

    if (roomId) {
      filters.roomId = roomId;
    }

    const incidents = await Incident.find(filters)
      .populate('roomId', 'number type')
      .sort({ createdAt: -1 });

    res.json(incidents);
  } catch (err) {
    console.error('Error obteniendo incidencias:', err);
    res.status(500).json({
      error: 'No se pudieron obtener las incidencias'
    });
  }
});

// Crear incidencia
app.post('/api/incidents', async (req, res) => {
  try {
    const {
      roomId,
      description,
      reportedBy,
      role,
      priority
    } = req.body;

    if (
      !roomId ||
      !description ||
      !description.trim() ||
      !reportedBy
    ) {
      return res.status(400).json({
        error: 'Habitación, descripción y responsable son obligatorios'
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        error: 'La habitación no existe'
      });
    }

    const incident = await Incident.create({
      roomId: room._id,
      roomNumber: room.number,
      description: description.trim(),
      reportedBy,
      role: role || 'HOUSEKEEPING',
      priority: priority || 'MEDIUM'
    });

    // Una incidencia de daño deja la habitación fuera de servicio.
    room.status = 'OUT_OF_SERVICE';
    await room.save();

    await logAudit(
      reportedBy,
      role || 'HOUSEKEEPING',
      `Reportó una incidencia en la habitación ${room.number}`,
      {
        incidentId: incident._id,
        description: incident.description,
        priority: incident.priority
      }
    );

    res.status(201).json({
      message: 'Incidencia registrada correctamente',
      incident
    });
  } catch (err) {
    console.error('Error creando incidencia:', err);
    res.status(400).json({
      error: 'No se pudo registrar la incidencia',
      details: err.message
    });
  }
});


 // Actualizar estado de una incidencia
app.patch('/api/incidents/:id', async (req, res) => {
  try {
    const { status, resolutionNotes, updatedBy, role } = req.body;

    const allowedStatuses = [
      'PENDING',
      'IN_PROGRESS',
      'RESOLVED'
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'El estado de la incidencia no es válido'
      });
    }

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        error: 'Incidencia no encontrada'
      });
    }

    // No permitir reabrir una incidencia después de autorizar
    // la recuperación de su habitación.
    const room = await Room.findById(incident.roomId);

    if (
      room &&
      room.status !== 'OUT_OF_SERVICE' &&
      status !== 'RESOLVED'
    ) {
      return res.status(400).json({
        error: 'No se puede reabrir esta incidencia desde esta ruta.'
      });
    }

    incident.status = status;

    if (resolutionNotes !== undefined) {
      incident.resolutionNotes = resolutionNotes;
    }

    incident.resolvedAt =
      status === 'RESOLVED' ? new Date() : null;

    await incident.save();

    await logAudit(
      updatedBy || 'Empleado',
      role || 'STAFF',
      `Actualizó incidencia de habitación ${incident.roomNumber} a ${status}`,
      { incidentId: incident._id }
    );

    return res.json({
      message: 'Incidencia actualizada correctamente',
      incident
    });
  } catch (err) {
    console.error('Error actualizando incidencia:', err);

    return res.status(400).json({
      error: 'No se pudo actualizar la incidencia',
      details: err.message
    });
  }
});

// Autorizar la recuperación de una habitación
app.patch('/api/incidents/:id/authorize-recovery', async (req, res) => {
  try {
    const { authorizedBy, role } = req.body;

    const authorizedRoles = [
      'RECEPTIONIST',
      'MANAGER',
      'ADMIN'
    ];

    if (!authorizedRoles.includes(role)) {
      return res.status(403).json({
        error: 'Solo recepción, gerencia o administración pueden autorizar la recuperación.'
      });
    }

    if (!authorizedBy || !authorizedBy.trim()) {
      return res.status(400).json({
        error: 'Debes indicar quién autoriza la recuperación.'
      });
    }

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        error: 'Incidencia no encontrada.'
      });
    }

    if (incident.status !== 'RESOLVED') {
      return res.status(400).json({
        error: 'Primero debe confirmarse que la reparación terminó.'
      });
    }

    const room = await Room.findById(incident.roomId);

    if (!room) {
      return res.status(404).json({
        error: 'No se encontró la habitación asociada.'
      });
    }

    if (room.status !== 'OUT_OF_SERVICE') {
      return res.status(400).json({
        error: 'La habitación no está fuera de servicio.'
      });
    }

    room.status = 'CLEANING';
    await room.save();

    await logAudit(
      authorizedBy,
      role,
      `Autorizó la recuperación de la habitación ${room.number}`,
      {
        incidentId: incident._id,
        roomId: room._id,
        previousStatus: 'OUT_OF_SERVICE',
        newStatus: 'CLEANING'
      }
    );

    return res.json({
      message: 'Recuperación autorizada. La habitación está pendiente de aseo.',
      room,
      incident
    });
  } catch (err) {
    console.error('Error autorizando recuperación:', err);

    return res.status(400).json({
      error: 'No se pudo autorizar la recuperación.',
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