const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tarifas.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');

router.get('/', auth, ctrl.listar);
router.put('/:id', auth, authorize('admin'), ctrl.actualizar);

module.exports = router;
