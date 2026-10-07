const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Conectado exitosamente');
  } catch (error) {
    console.error('❌ Error de conexión a MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;