require('dotenv').config();
const services = require('../services/withdrawal');

async function getWithdrawal(req, res) {
    try {
        const {filter, sorting, pagination} = req.body;
        const dataWithdrawals = await services.getDataWithdrawal(filter, sorting, pagination);
        const result = {data: dataWithdrawals, full_name: req.user?.full_name ?? null};
        res.status(200).json({result});
    } catch (error) {
        console.log(error);
        res.status(error.status).json({status: error.status, message: error.message});
    }
}

async function createWithdrawal(req, res) {
    try {
        let {date} = req.body;
        if (!date || date === '') date = new Date();
        const dataWithdrawals = await services.createDataWithdrawal(date, req.user.id);
        res.status(200).json({dataWithdrawals});
    } catch (error) {
        console.log(error);
        res.status(error.status).json({status: error.status, message: error.message, data: error.data});
    }
}

async function deleteWithdrawal(req, res) {
    try {
        const {id, reason} = req.body;
        const deleteData = await services.deleteDataWithdrawal(id, reason);
        res.status(200).json({deleteData});
    } catch (error) {
        console.log(error);
        res.status(error.status).json({status: error.status, message: error.message});
    }
}

async function withdrawalPage(req, res) {
    const auth = req.user?.full_name;
    if (!auth) return res.redirect('/');
    res.render('withdrawal', {full_name: auth});
}

module.exports = {
    getWithdrawal,
    createWithdrawal,
    deleteWithdrawal,
    withdrawalPage
};
