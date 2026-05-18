const { Usuario } = require('../models');
const bcrypt = require('bcryptjs');

const usuariosController = {
  async listar(req, res) {
    try {
      const usuarios = await Usuario.findAll({
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']],
      });
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar usuarios' });
    }
  },
  async crear(req, res) {
    try {
      const { nombre, email, password, rol } = req.body;
      if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'nombre, email y password son requeridos' });
      }
      const existe = await Usuario.findOne({ where: { email } });
      if (existe) return res.status(400).json({ error: 'El email ya está registrado' });
      const usuario = await Usuario.create({ nombre, email, password, rol: rol || 'cajero' });
      const { password: _, ...data } = usuario.toJSON();
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Error al crear usuario' });
    }
  },
  async actualizar(req, res) {
    try {
      const usuario = await Usuario.findByPk(req.params.id);
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
      const { nombre, email, activo, rol, password } = req.body;
      if (nombre) usuario.nombre = nombre;
      if (email) usuario.email = email;
      if (activo !== undefined) usuario.activo = activo;
      if (rol) usuario.rol = rol;
      if (password) usuario.password = password;
      await usuario.save();
      const { password: _, ...data } = usuario.toJSON();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  },
  async eliminar(req, res) {
    try {
      const usuario = await Usuario.findByPk(req.params.id);
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
      usuario.activo = false;
      await usuario.save();
      res.json({ message: 'Usuario desactivado' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  },
};

module.exports = usuariosController;
