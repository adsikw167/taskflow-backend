const bcrypt = require('bcryptjs');

const password = 'Admin123!';
const hash = bcrypt.hashSync(password, 12);

console.log('Password:', password);
console.log('\nBcrypt Hash:');
console.log(hash);
console.log('\nCopy this JSON and insert it in Atlas:');
console.log(JSON.stringify({
  name: 'Admin',
  email: 'admin@taskflow.com',
  password: hash,
  avatar: '',
  createdAt: new Date(),
  updatedAt: new Date()
}, null, 2));
