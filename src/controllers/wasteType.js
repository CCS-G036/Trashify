require('dotenv').config();
const services = require('../services/wasteType');

async function getWasteType(req, res) {
    try {
        const {filter, sorting, pagination} = req.body;
        const dataWasteTypes = await services.getDataWasteType(filter, sorting, pagination);
        const result = {data: dataWasteTypes, full_name: req.user?.full_name ?? null};
        res.status(200).json({result});
    } catch (error) {
        console.log(error);
        res.status(error.status).json({status: error.status, message: error.message});
    }
}

async function wasteTypePage(req, res) {
    const auth = req.user?.full_name;
    if (!auth) return res.redirect('/');
    res.render('waste-type', {full_name: auth});
}

async function createWasteType(req, res) {
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
        const dataWasteTypes = await services.createDataWasteType(inputMap);
        res.status(200).json({dataWasteTypes});
    } catch (error) {
        console.log(error);
        res.status(error.status).json({status: error.status, message: error.message, data: error.data});
    }
}

async function updateWasteType(req, res) {
    try {
        const {id, input} = req.body;
        const dataWasteTypes = await services.updateDataWasteType(id, input);
        res.status(200).json({dataWasteTypes});
    } catch (error) {
        console.log(error);
        res.status(error.status).json({status: error.status, message: error.message, data: error.data});
    }
}

async function deleteWasteType(req, res) {
    try {
        const {id} = req.body;
        const deleteData = await services.deleteDataWasteType(id);
        res.status(200).json({deleteData});
    } catch (error) {
        console.log(error);
        res.status(error.status).json({status: error.status, message: error.message});
    }
}

module.exports = {
    getWasteType,
    createWasteType,
    updateWasteType,
    deleteWasteType,
    wasteTypePage
};
