const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usuarios.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');

router.get('/', auth, authorize('admin'), ctrl.listar);
router.post('/', auth, authorize('admin'), ctrl.crear);
router.put('/:id', auth, authorize('admin'), ctrl.actualizar);
router.delete('/:id', auth, authorize('admin'), ctrl.eliminar);

module.exports = router;
