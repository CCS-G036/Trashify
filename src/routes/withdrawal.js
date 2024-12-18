const express = require('express');
const withdrawalController = require('../controllers/withdrawal');
const adminController = require('../controllers/admin');

// initiate router
const router = express.Router();

// Sub route / for Withdrawal
router.get('/', adminController.auth, withdrawalController.withdrawalPage);
router.post('/', adminController.auth, withdrawalController.createWithdrawal);
router.post('/table', adminController.auth, withdrawalController.getWithdrawal);
router.delete('/', adminController.auth, withdrawalController.deleteWithdrawal);

module.exports = router;
