require('dotenv').config();
const services = require('../services/customer');
const moment = require('moment');

async function getCustomer(req, res) {
    try {
        const {filter, sorting, pagination} = req.body;
        const dataCustomers = await services.getDataCustomer(filter, sorting, pagination);
        const result = {data: dataCustomers, full_name: req.user?.full_name ?? null};
        res.status(200).json({result});
    } catch (error) {
        console.log(error);
        res.status(error.status).json({status: error.status, message: error.message});
    }
}

async function createCustomer(req, res) {
    try {
        const {input} = req.body;
        // handle empty value each field
        const inputMap = input.map(eachData => {
            let noEmptyValue = {creator: req.user.id};
            for (const eachField in eachData) {
                if (eachData[eachField]) noEmptyValue[eachField] = eachData[eachField];
            }

            return noEmptyValue;
        });

        // call the service with new parameter
        const dataCustomers = await services.createDataCustomer(inputMap);
        res.status(200).json({dataCustomers});
    } catch (error) {
        console.log(error);
        res.status(error.status).json({status: error.status, message: error.message, data: error.data});
    }
}

async function updateCustomer(req, res) {
    try {
        const {id, input} = req.body;
        const dataCustomers = await services.updateDataCustomer(id, input);
        res.status(200).json({dataCustomers});
    } catch (error) {
        console.log(error);
        res.status(error.status).json({status: error.status, message: error.message, data: error.data});
    }
}

async function deleteCustomer(req, res) {
    try {
        const {id} = req.body;
        const deleteData = await services.deleteDataCustomer(id);
        res.status(200).json({deleteData});
    } catch (error) {
        console.log(error);
        res.status(error.status).json({status: error.status, message: error.message});
    }
}

async function getProfileCustomer(req, res) {
    try {
        const {id} = req.params;
        const dataProfileCustomer = await services.getProfileCustomer(id);
        const result = {data: dataProfileCustomer, full_name: req.user?.full_name ?? null};
        res.render('profile-customer', result);
    } catch (error) {
        console.log(error);
        res.status(error.status).json({status: error.status, message: error.message});
    }
}

async function customerPage(req, res) {
    const auth = req.user?.full_name;
    if (!auth) return res.redirect('/');
    res.render('customer', {full_name: auth});
}

module.exports = {
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getProfileCustomer,
    customerPage
};
