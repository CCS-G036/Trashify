require('dotenv').config();
const services = require('../services/home.js');

async function getHomeData(req, res) {
    try {
        let isLogin = req.user?.full_name ? true : false;
        const dataHome = await services.getDataHome(isLogin);
        const result = {full_name: req.user?.full_name ?? null, data: dataHome};
        res.render(result.full_name ? 'dashboard' : 'home', result);
    } catch (error) {
        console.log(error);
        res.status(error.status).json({status: error.status, message: error.message});
    }
}

module.exports = {
    getHomeData
};
