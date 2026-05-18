const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/mensualidades.controller');
const auth = require('../middlewares/auth');

router.get('/', auth, ctrl.listar);
router.get('/verificar/:placa', auth, ctrl.verificar);
router.post('/', auth, ctrl.registrar);
router.post('/renovar/:id', auth, ctrl.renovar);

module.exports = router;
