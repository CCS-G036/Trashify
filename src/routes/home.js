const express = require('express');
const homeController = require('../controllers/home');
const services = require('../services/admin');
// initiate router
const router = express.Router();

// Sub route / for home
router.get('/', defaultPageMiddleware, homeController.getHomeData);

async function defaultPageMiddleware(req, res, next) {
    try {
        const token = req.cookies['accessToken'] ?? null;
        if (!token) return await next();
        req.user = await services.verifyToken(token, 'access') ?? null;
        return await next();
    } catch (error) {
        if (error.message === 'jwt expired') {
            const newToken = await services.refreshToken(req.cookies['refreshToken'])
            res.cookie('accessToken', newToken, {httpOnly: true, sameSite: true});
            req.user = await services.verifyToken(newToken, 'access');
            return await next();
        }

        res.status(error.status).json({status: error.status, message: error.message});
    }
}

module.exports = router;
