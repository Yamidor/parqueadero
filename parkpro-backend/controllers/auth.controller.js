const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/config');

const authController = {
  // POST /api/auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
      }

      const usuario = await Usuario.findOne({ where: { email } });
      if (!usuario) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }

      if (!usuario.activo) {
        return res.status(401).json({ error: 'Usuario desactivado. Contacte al administrador.' });
      }

      const passwordValido = await usuario.validarPassword(password);
      if (!passwordValido) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }

      const token = jwt.sign(
        { id: usuario.id, email: usuario.email, rol: usuario.rol },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  },

  // GET /api/auth/me
  async me(req, res) {
    try {
      res.json({
        usuario: {
          id: req.user.id,
          nombre: req.user.nombre,
          email: req.user.email,
          rol: req.user.rol,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Error en el servidor' });
    }
  },
};

module.exports = authController;
