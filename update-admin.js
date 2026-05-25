const bcrypt = require('bcryptjs');

const password = 'Admin123!';
const hash = bcrypt.hashSync(password, 12);

console.log('Update the admin user in Atlas with this document:\n');
console.log('{');
console.log('  "name": "Admin",');
console.log('  "email": "admin@taskflow.com",');
console.log(`  "password": "${hash}",`);
console.log('  "avatar": "",');
console.log('  "isGlobalAdmin": true,');
console.log('  "__v": 0');
console.log('}');
console.log('\nOr just add this field to the existing admin user:');
console.log('  "isGlobalAdmin": true');
