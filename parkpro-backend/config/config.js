module.exports = {
  PORT: 3001,
  JWT_SECRET: 'parkpro_secret_jwt_2024_$ecure!',
  JWT_EXPIRES_IN: '24h',
  DEFAULT_ADMIN: {
    nombre: 'Administrador',
    email: 'admin@parkpro.com',
    password: 'Admin123!',
    rol: 'admin',
  },
  DEFAULT_TARIFAS: [
    { tipo: 'hora_moto', valor: 2000 },
    { tipo: 'hora_carro', valor: 3000 },
    { tipo: 'mensualidad_moto', valor: 60000 },
    { tipo: 'mensualidad_carro', valor: 80000 },
    { tipo: 'lavado_moto_normal', valor: 8000 },
    { tipo: 'lavado_moto_full', valor: 14000 },
    { tipo: 'lavado_carro_normal', valor: 15000 },
    { tipo: 'lavado_carro_full', valor: 25000 },
  ],
  DEFAULT_CONFIG: {
    nombreNegocio: 'ParkPro Parqueadero',
    nit: '900.123.456-7',
    direccion: 'Calle Principal #123',
    telefono: '300 123 4567',
  },
};
