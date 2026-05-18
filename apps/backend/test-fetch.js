const fetch = require('node-fetch');

async function test() {
  const res = await fetch('http://127.0.0.1:3002/api/patients/123/documents');
  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("BODY:", text);
}
test();
