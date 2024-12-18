const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');

// Sub route / for logout
router.get('/', adminController.auth, (req, res) => {
    res.clearCookie('accessToken', {httpOnly: true, sameSite: true});
    res.clearCookie('refreshToken', {httpOnly: true, sameSite: true});
    res.send('logout');
});

module.exports = router;
