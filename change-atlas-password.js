require('dotenv').config();
const https = require('https');

const ATLAS_PUBLIC_KEY = process.env.ATLAS_PUBLIC_KEY || '';
const ATLAS_PRIVATE_KEY = process.env.ATLAS_PRIVATE_KEY || '';
const PROJECT_ID = process.env.ATLAS_PROJECT_ID || '';
const USERNAME = 'adsikarwar7668_db_user';
const NEW_PASSWORD = process.env.NEW_DB_PASSWORD || 'NewSecurePassword123!';

const options = {
  hostname: 'cloud.mongodb.com',
  path: `/api/atlas/v1.0/groups/${PROJECT_ID}/databaseUsers/admin/${USERNAME}`,
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  auth: `${ATLAS_PUBLIC_KEY}:${ATLAS_PRIVATE_KEY}`
};

const data = JSON.stringify({
  password: NEW_PASSWORD
});

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✓ Password changed successfully!');
      console.log(`New connection string: mongodb+srv://${USERNAME}:${NEW_PASSWORD}@cluster0.rkzjrng.mongodb.net/myDatabase?appName=Cluster0&retryWrites=true&w=majority`);
    } else {
      console.error('✗ Failed to change password');
      console.error('Status:', res.statusCode);
      console.error('Response:', body);
    }
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
