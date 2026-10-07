const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Room = require('./models/Room');
const User = require('./models/User');

dotenv.config();

const roomsData = [
  { number: '101', type: 'Sencilla', capacity: 1, pricePerNight: 120000, status: 'AVAILABLE' },
  { number: '102', type: 'Sencilla', capacity: 1, pricePerNight: 120000, status: 'CLEANING' },
  { number: '201', type: 'Doble', capacity: 2, pricePerNight: 200000, status: 'OCCUPIED' },
  { number: '301', type: 'Suite', capacity: 4, pricePerNight: 350000, status: 'RESERVED' },
  { number: '302', type: 'Suite', capacity: 4, pricePerNight: 350000, status: 'OUT_OF_SERVICE' }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB...');

    // Limpiar base de datos
    await Room.deleteMany({});
    await User.deleteMany({});

    // Crear habitaciones y usuarios iniciales
    const createdRooms = await Room.insertMany(roomsData);
    console.log(`✅ ${createdRooms.length} Habitaciones insertadas correctamente.`);

    await User.create([
      { name: 'Admin Principal', email: 'admin@hotel.com', password: '123', role: 'ADMIN' },
      { name: 'Carlos Ruiz', email: 'recep@hotel.com', password: '123', role: 'RECEPTIONIST' },
      { name: 'Maria Gomez', email: 'aseo@hotel.com', password: '123', role: 'HOUSEKEEPING' },
      { name: 'Laura Perez', email: 'gerente@hotel.com', password: '123', role: 'MANAGER' }
    ]);
    console.log('✅ Usuarios iniciales creados.');

    process.exit();
  } catch (error) {
    console.error('❌ Error al poblar BD:', error);
    process.exit(1);
  }
};

seedDB();
