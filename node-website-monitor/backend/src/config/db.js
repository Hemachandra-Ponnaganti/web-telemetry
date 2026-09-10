const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/website_monitor';
    console.log('🔌 Connecting to MongoDB SRE database...');
    
    // Set low timeout to fall back quickly if offline
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`📡 MongoDB Connected: ${mongoose.connection.name}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB connection refused: ${error.message}`);
    console.warn(`🚀 SRE Backend falling back to In-Memory mock datastore for this session.`);
    return false;
  }
};

module.exports = connectDB;
