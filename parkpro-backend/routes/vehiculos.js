const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/vehiculos.controller');
const auth = require('../middlewares/auth');

router.get('/', auth, ctrl.listar);
router.get('/placa/:placa', auth, ctrl.buscarPorPlaca);
router.post('/', auth, ctrl.crear);
router.put('/:id', auth, ctrl.actualizar);

module.exports = router;
