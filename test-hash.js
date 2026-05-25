const bcrypt = require('bcryptjs');

const password = 'Admin123!';
const hashFromAtlas = '$2a$12$0cJiYUr8noj8tak1l3IJ1unkEb3ynHq05i7y/BLfgI2/9OPDEPwaC';

bcrypt.compare(password, hashFromAtlas, (err, result) => {
  console.log('Password:', password);
  console.log('Hash:', hashFromAtlas);
  console.log('Match:', result);
  
  if (result) {
    console.log('\n✓ Password hash is correct!');
    console.log('The issue might be:');
    console.log('1. Railway backend not connected to Atlas');
    console.log('2. Different database being used');
    console.log('3. Email case sensitivity');
  } else {
    console.log('\n✗ Password hash does NOT match!');
    console.log('Need to regenerate the hash');
  }
});
