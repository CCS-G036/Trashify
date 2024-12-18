require('dotenv').config();
const services = require('../services/admin');

async function loginController(req, res) {
    try {
        let {username, password} = req.body;
        if (!username || !password) throw {status: 400, error: 'need username and password'};
        username = username.toLowerCase();
        const data = await services.getToken(username, password);
        res.cookie('accessToken', data.accessToken, {httpOnly: true, sameSite: true});
        res.cookie('refreshToken', data.refreshToken, {httpOnly: true, sameSite: true,});
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(error.status).json({status: error.status, message: error.message});
    }
}

async function loginPage(req, res) {
    try {
        if (req.cookies['token']?.accessToken) return res.redirect('/');

        res.render('login');
    } catch (error) {
        res.status(error.status).json({status: error.status, message: error.message});
    }
}

async function refreshTokenController(req, res) {
    try {
        const {refreshToken} = req.body;
        if (!refreshToken) throw {status: 400, message: 'need refresh token'};

        const newAccessToken = await services.adminRefresh(refreshToken);
        res.status(200).json({newAccessToken});
    } catch (error) {
        console.log(error);
        res.status(error.status).json({status: error.status, message: error.message});
    }
}

async function auth(req, res, next) {
    try {
        // const token = req.headers['authorization'];
        const token = req.cookies['accessToken'] ?? null;
        if (!token) return res.redirect('/');
        req.user = await services.verifyToken(token, 'access');
        return await next();
    } catch (error) {
        console.log(error);
        if (error.message === 'jwt expired') {
            const newToken = await services.refreshToken(req.cookies['refreshToken'])
            res.cookie('accessToken', newToken, {httpOnly: true, sameSite: true});
            req.user = await services.verifyToken(newToken, 'access');
            return await next();
        }

        res.status(error.status).json({status: error.status, message: error.message});
    }
}

module.exports = {
    auth,
    loginController,
    refreshTokenController,
    loginPage
};
