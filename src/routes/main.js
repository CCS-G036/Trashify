const express = require('express');
const router = express.Router();

const adminRoutes = require('./admin');
const customerRoutes = require('./customer');
const wasteTypeRoutes = require('./wasteType');
const depositRoutes = require('./deposit');
const withdrawalRoutes = require('./withdrawal');
const homeRoutes = require('./home');
const logoutRoutes = require('./logout');

router.use('/', adminRoutes);
router.use('/customer', customerRoutes);
router.use('/waste-type', wasteTypeRoutes);
router.use('/deposit', depositRoutes);
router.use('/withdrawal', withdrawalRoutes);
router.use('/logout', logoutRoutes);
router.use('/*', homeRoutes);

module.exports = router;