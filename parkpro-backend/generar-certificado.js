// Genera un certificado autofirmado para servir el sistema por HTTPS en la red local.
// Necesario para que la cámara (escaneo de QR) funcione desde celulares/PC en la red,
// porque los navegadores solo permiten cámara en HTTPS o en localhost.
//
// Uso:  node generar-certificado.js
// Crea: certs/key.pem  y  certs/cert.pem

const fs = require('fs');
const path = require('path');
const os = require('os');
const selfsigned = require('selfsigned');

const CERT_DIR = path.join(__dirname, 'certs');
if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });

// Reunir las IPs locales para incluirlas en el certificado
const ips = ['127.0.0.1'];
const nets = os.networkInterfaces();
for (const nombre of Object.keys(nets)) {
  for (const net of nets[nombre]) {
    if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
  }
}

const altNames = [
  { type: 2, value: 'localhost' },           // DNS
  ...ips.map((ip) => ({ type: 7, ip })),     // IPs
];

const attrs = [{ name: 'commonName', value: 'ParkPro' }];

async function main() {
  // En selfsigned v5 generate() es asíncrono (devuelve Promise)
  const pems = await selfsigned.generate(attrs, {
    days: 3650, // 10 años
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [{ name: 'subjectAltName', altNames }],
  });

  fs.writeFileSync(path.join(CERT_DIR, 'key.pem'), pems.private);
  fs.writeFileSync(path.join(CERT_DIR, 'cert.pem'), pems.cert);

  console.log('✅ Certificado generado en:', CERT_DIR);
  console.log('   IPs incluidas:', ips.join(', '));
}

main().catch((e) => {
  console.error('❌ Error generando certificado:', e.message);
  process.exit(1);
});
