const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/configuracion.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');

router.get('/', ctrl.obtener);
router.put('/', auth, authorize('admin'), ctrl.actualizar);

module.exports = router;
