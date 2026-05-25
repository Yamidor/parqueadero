const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/whatsapp.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');

router.get('/status', auth, authorize('admin'), ctrl.status);
router.post('/connect', auth, authorize('admin'), ctrl.connect);
router.post('/disconnect', auth, authorize('admin'), ctrl.disconnect);

module.exports = router;
