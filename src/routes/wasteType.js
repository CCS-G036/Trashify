const express = require('express');
const wasteTypeController = require('../controllers/wasteType');
const adminController = require('../controllers/admin');

// initiate router
const router = express.Router();

// Sub route / for WasteType
router.get('/', adminController.auth, wasteTypeController.wasteTypePage);
router.post('/table', adminController.auth, wasteTypeController.getWasteType);
router.post('/', adminController.auth, wasteTypeController.createWasteType);
router.put('/', adminController.auth, wasteTypeController.updateWasteType);
router.delete('/', adminController.auth, wasteTypeController.deleteWasteType);

module.exports = router;
