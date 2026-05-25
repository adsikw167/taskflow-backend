const dns = require('dns');

// Try to resolve the SRV record
dns.resolveSrv('_mongodb._tcp.cluster0.rkzjrng.mongodb.net', (err, addresses) => {
  if (err) {
    console.log('SRV resolution failed:', err.message);
    console.log('\nManual solution:');
    console.log('1. Go to Atlas > Database > Connect > Shell');
    console.log('2. Look for connection string starting with mongodb:// (not mongodb+srv://)');
    console.log('3. Or contact MongoDB support for standard connection string');
    console.log('\nAlternative: Use MongoDB locally instead of Atlas');
  } else {
    console.log('SRV Records found:');
    addresses.forEach(addr => {
      console.log(`  ${addr.name}:${addr.port}`);
    });
    
    const hosts = addresses.map(a => `${a.name}:${a.port}`).join(',');
    const standardUri = `mongodb://adsikarwar7668_db_user:Admin1234@${hosts}/myDatabase?retryWrites=true&w=majority&authSource=admin`;
    console.log('\nStandard connection string:');
    console.log(standardUri);
  }
});
