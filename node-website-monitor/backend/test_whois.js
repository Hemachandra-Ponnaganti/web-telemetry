const whoiser = require('whoiser');

async function testWhois() {
  const domainInfo = await whoiser('gadigitalsolutions.com', { follow: 1 });
  console.log(JSON.stringify(domainInfo, null, 2));
}

testWhois();
