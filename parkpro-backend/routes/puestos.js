const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/puestos.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');

router.get('/', auth, ctrl.listar);
router.post('/', auth, authorize('admin'), ctrl.crear);
router.put('/:id', auth, authorize('admin'), ctrl.actualizar);
router.delete('/:id', auth, authorize('admin'), ctrl.eliminar);

module.exports = router;
