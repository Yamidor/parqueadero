const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportes.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');

router.get('/', auth, authorize('admin'), ctrl.obtener);

module.exports = router;
