const express = require('express');
const customerController = require('../controllers/customer');
const adminController = require('../controllers/admin');

// initiate router
const router = express.Router();

// Sub route / for customer
router.get('/', adminController.auth, customerController.customerPage);
router.get('/:id', adminController.auth, customerController.getProfileCustomer);
router.post('/table', adminController.auth, customerController.getCustomer);
router.post('/', adminController.auth, customerController.createCustomer);
router.put('/', adminController.auth, customerController.updateCustomer);
router.delete('/', adminController.auth, customerController.deleteCustomer);

module.exports = router;
