require('dotenv').config();
const moment = require('moment');
const customerModel = require('../models/customer');
const wasteTypeModel = require('../models/wasteType');
const depositModel = require('../models/deposit');
const withdrawalModel = require('../models/withdrawal');

async function getDataHome(isLogin) {
    try {
        let countCustomer = 0;
        let totalDeposit = 0;
        let countWasteType = await wasteTypeModel.countDocuments();

        let rawDataset = [];

        const currentYear = moment().format('YYYY');
        const startDate = moment(currentYear + '-01-01').startOf('day').toDate();
        const endDate = moment(currentYear + '-12-31').endOf('day').toDate();

        const filterRawDataDeposit = {
            status: 'active'
        };

        if (!isLogin) filterRawDataDeposit.deposit_date = {$gte: startDate, $lte: endDate};

        const rawDataCustomer = await customerModel.find({status: 'active'}).lean();
        const rawDataWasteType = await wasteTypeModel.find({status: 'active'}).sort({name: 1}).limit(10).lean();
        const rawDataWasteTypeCounter = await wasteTypeModel.find({status: 'active'}).sort({deposit_count: -1}).limit(5).lean();
        const rawDataDeposit = await depositModel.find(filterRawDataDeposit).sort({deposit_date: 1}).lean();
        const rawDataWitdhrawal = await withdrawalModel.find({}).sort({createdAt: -1}).lean();
        if (rawDataCustomer.length) {
            // add counter
            countCustomer = rawDataCustomer.length;
        }


        if (rawDataDeposit?.length) {
            rawDataDeposit.forEach(deposit => {
                const getMonth = moment(deposit.deposit_date).format('MMMM-YYYY');
                let checkMonth = rawDataset.find(data => data.month === getMonth);
                if (!checkMonth) {
                    checkMonth = {month: getMonth, customers: []};
                    rawDataset.push(checkMonth);
                }

                checkMonth.customers.push({id: deposit.customer, amount: deposit.amount});
            })

            // count total deposit
            rawDataDeposit.forEach(deposit => totalDeposit += deposit.amount ?? 0);

            // translate
            if (totalDeposit >= 1000000) {
                const millions = parseFloat(totalDeposit / 1000000).toFixed(1);
                totalDeposit = `${millions}jt`;
            } else if (totalDeposit >= 1000) {
                const thousands = parseFloat(totalDeposit / 1000).toFixed(1);
                totalDeposit = `${thousands}k`;
            } else {
                totalDeposit = `${totalDeposit}`;
            }
        }


        // dataset for chart deposit
        const listMonth = rawDataset.map(data => data.month);
        const listAmountDeposit = rawDataset.map(data => data.customers.reduce((acc, current) => acc + current.amount, 0));
        // const listCustomer = rawDataset.map(data => data.customers.length);
        const listCustomer = rawDataset.map(monthData => {
            const uniqueCustomers = new Set(monthData.customers.map(customer => String(customer.id._id)));
            return uniqueCustomers.size;
        });

        const listWasteTypeName = rawDataWasteTypeCounter.map(
            data => data.name.charAt(0).toUpperCase() + data.name.slice(1)
        );
        const listWasteTypeCount = rawDataWasteTypeCounter.map(data => data.deposit_count);

        const lastDataCustomer = rawDataCustomer
            .slice()
            .sort((a, b) => new Date(b.join_date) - new Date(a.join_date))[0] || {};
        const lastDataWithdrawal = rawDataWitdhrawal[0] || {};
        const lastDataDeposit = rawDataDeposit
            .slice()
            .sort((a, b) => new Date(b.deposit_date) - new Date(a.deposit_date))[0] || {};
        const lastDataWasteType = rawDataWasteType
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || {};


        const dataHome = {
            currentYear,
            countCustomer,
            totalDeposit,
            countWasteType,
            listMonth,
            listAmountDeposit,
            listCustomer,
            rawDataWasteType,
            listWasteTypeName,
            listWasteTypeCount
        };

        const dataDashboard = {
            countCustomer,
            countWasteType,
            totalDeposit,
            lastDataCustomer,
            lastDataWithdrawal,
            lastDataDeposit,
            lastDataWasteType
        };

        if (lastDataCustomer?.join_date) lastDataCustomer.join_date = moment(lastDataCustomer.join_date).format('ll');
        if (lastDataDeposit?.deposit_date) lastDataDeposit.deposit_date = moment(lastDataDeposit.deposit_date).format('ll');
        if (lastDataWasteType?.createdAt) lastDataWasteType.createdAt = moment(lastDataWasteType.createdAt).format('ll');
        if (lastDataWithdrawal?.createdAt) lastDataWithdrawal.createdAt = moment(lastDataWithdrawal.createdAt).format('ll');

        return {dataHome, dataDashboard};
    } catch (error) {
        throw {status: error.status ?? 400, message: error.message};
    }
}

module.exports = {
    getDataHome,
};
