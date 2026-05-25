const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    console.log('Connecting to:', uri ? 'Atlas (env var found)' : 'NO URI FOUND');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      family: 4
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.log('\nTroubleshooting:');
    console.log('1. Check if your IP is whitelisted in Atlas Network Access');
    console.log('2. Try using a VPN or different network');
    console.log('3. Check if your firewall/antivirus is blocking MongoDB');
    console.log('\nServer will continue running without database connection...');
    // Don't exit, let server run
  }
};

module.exports = connectDB;