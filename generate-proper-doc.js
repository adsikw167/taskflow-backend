const bcrypt = require('bcryptjs');

const password = 'Admin123!';
const hash = bcrypt.hashSync(password, 12);

console.log('Delete the existing admin user in Atlas, then insert this:\n');
console.log('{');
console.log('  "name": "Admin",');
console.log('  "email": "admin@taskflow.com",');
console.log(`  "password": "${hash}",`);
console.log('  "avatar": "",');
console.log('  "createdAt": { "$date": "' + new Date().toISOString() + '" },');
console.log('  "updatedAt": { "$date": "' + new Date().toISOString() + '" }');
console.log('}');
