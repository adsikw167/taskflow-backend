const http = require('http');

const data = JSON.stringify({
  name: 'Admin',
  email: 'admin@taskflow.com',
  password: 'Admin123!'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const response = JSON.parse(body);
    if (res.statusCode === 201) {
      console.log('✓ Admin user created successfully!');
      console.log('\nLogin Credentials:');
      console.log('  Email: admin@taskflow.com');
      console.log('  Password: Admin123!');
    } else if (res.statusCode === 400 && body.includes('already in use')) {
      console.log('✓ Admin user already exists!');
      console.log('\nLogin Credentials:');
      console.log('  Email: admin@taskflow.com');
      console.log('  Password: Admin123!');
    } else {
      console.error('✗ Failed:', response.message);
    }
  });
});

req.on('error', (e) => {
  console.error('✗ Error: Backend server not running on port 5000');
  console.error('  Please start the server first: npm run dev');
});

req.write(data);
req.end();
