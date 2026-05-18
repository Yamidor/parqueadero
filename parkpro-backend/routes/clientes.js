const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/clientes.controller');
const auth = require('../middlewares/auth');

router.get('/', auth, ctrl.listar);
router.get('/:id', auth, ctrl.obtener);
router.get('/:id/historial', auth, ctrl.historial);
router.post('/', auth, ctrl.crear);
router.put('/:id', auth, ctrl.actualizar);

module.exports = router;
