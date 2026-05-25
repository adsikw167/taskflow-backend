require('dotenv').config();
const mongoose = require('mongoose');

const testConnections = async () => {
  const originalUri = process.env.MONGO_URI;
  
  console.log('Testing MongoDB Connection...\n');
  console.log('Original URI:', originalUri.replace(/:[^:@]+@/, ':****@'));
  
  // Test with different options
  const options = [
    { name: 'Default + IPv4', opts: { family: 4 } },
    { name: 'With directConnection', opts: { directConnection: false, family: 4 } },
    { name: 'Extended timeout', opts: { serverSelectionTimeoutMS: 30000, family: 4 } }
  ];
  
  for (const test of options) {
    try {
      console.log(`\nTrying: ${test.name}...`);
      await mongoose.connect(originalUri, test.opts);
      console.log('✓ SUCCESS! Connected to MongoDB');
      console.log(`Host: ${mongoose.connection.host}`);
      await mongoose.connection.close();
      return;
    } catch (err) {
      console.log(`✗ Failed: ${err.message}`);
    }
  }
  
  console.log('\n--- All connection attempts failed ---');
  console.log('\nPlease get a new connection string from Atlas:');
  console.log('1. Go to Atlas > Connect > Connect your application');
  console.log('2. Copy the connection string');
  console.log('3. Update MONGO_URI in .env file');
};

testConnections();
