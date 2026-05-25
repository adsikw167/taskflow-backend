require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Connected to MongoDB');
};

const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  avatar: String,
  createdAt: Date
}));

const main = async () => {
  await connectDB();
  
  console.log('\n--- Existing Users ---');
  const users = await User.find({}).select('name email createdAt');
  if (users.length === 0) {
    console.log('No users found.');
  } else {
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.name} (${u.email}) - Created: ${u.createdAt}`);
    });
  }
  
  console.log('\n--- Creating Admin User ---');
  const adminEmail = 'admin@taskflow.com';
  const adminPassword = 'Admin123!';
  
  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    console.log(`✓ Admin user already exists: ${adminEmail}`);
    console.log(`  Password: Admin123!`);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await User.create({
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      avatar: ''
    });
    console.log(`✓ Admin user created successfully!`);
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
  }
  
  mongoose.connection.close();
};

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
