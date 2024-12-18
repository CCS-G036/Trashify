const express = require('express');
const adminController = require('../controllers/admin');

// initiate router
const router = express.Router();

// Sub route / for login
router.get('/login', adminController.loginPage);
router.post('/login', adminController.loginController);
router.post('/refresh', adminController.refreshTokenController);

module.exports = router;
