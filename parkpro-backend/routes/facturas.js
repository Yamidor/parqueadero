const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/facturas.controller');
const auth = require('../middlewares/auth');

router.get('/', auth, ctrl.listar);
router.get('/buscar', auth, ctrl.buscar);
router.get('/:id', auth, ctrl.obtener);
router.post('/entrada', auth, ctrl.registrarEntrada);
router.post('/salida', auth, ctrl.registrarSalida);
router.post('/lavado', auth, ctrl.registrarLavado);

module.exports = router;
