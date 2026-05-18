const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');
const { Usuario } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const usuario = await Usuario.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no autorizado o inactivo' });
    }

    req.user = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = authMiddleware;
