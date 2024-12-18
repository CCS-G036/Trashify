require('dotenv').config();
const bcrypt = require('bcrypt');
const adminModel = require('../models/admin');
const jwt = require('jsonwebtoken');

async function getToken(usernameOrEmail, password) {
    // check account
    const adminFound = await adminModel.findOne({
        $or: [{email: usernameOrEmail}, {username: usernameOrEmail}]
    }).lean();
    if (!adminFound) throw {status: 404, message: 'account not found'};

    // check password
    const isMatch = await bcrypt.compare(password, adminFound.password);
    if (!isMatch) throw {status: 401, message: 'wrong password'};

    // initiate payload for token
    const payload = {
        id: adminFound._id,
        full_name: adminFound.full_name
    };

    // Generaste token and data admin
    const accessToken = jwt.sign(payload, process.env.SECRET_KEY_ACCESS, {expiresIn: '30m'});
    const refreshToken = jwt.sign(payload, process.env.SECRET_KEY_REFRESH, {expiresIn: '8h'});
    const admin = {
        _id: adminFound._id,
        full_name: adminFound.full_name
    };

    return {
        accessToken,
        refreshToken,
        admin
    };
}

async function refreshToken(refreshToken) {
    try {
        await verifyToken(refreshToken, 'refresh');
        const decodedToken = jwt.decode(refreshToken);
        const payload = {
            id: decodedToken.id,
            full_name: decodedToken.full_name
        };

        return jwt.sign(payload, process.env.SECRET_KEY_ACCESS, {expiresIn: '30m'});
    } catch (error) {
        throw {status: error.status ?? 401, message: error.message};
    }
}

async function verifyToken(token, type) {
    try {
        if (!type) throw {status: 400, message: 'need type of token'};
        const typeToken = type === 'access' ? process.env.SECRET_KEY_ACCESS : process.env.SECRET_KEY_REFRESH;
        return jwt.verify(token, typeToken);
    } catch (error) {
        throw {status: error.status ?? 403, message: error.message};
    }
}

module.exports = {
    verifyToken,
    refreshToken,
    getToken
}