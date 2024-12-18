require('dotenv').config();
const customerModel = require('../models/customer');
const depositModel = require('../models/deposit');
const withdrawalModel = require('../models/withdrawal');
const moment = require('moment');

async function getDataCustomer(filter, sorting, pagination) {
    try {
        // initiate query 
        let queryFilter = {};
        let querySorting = {};
        if (pagination?.page > 0) pagination.page -= 1;
        const limit = pagination && pagination.limit || 10;
        const skip = limit * (pagination && pagination.page || 0);

        if (filter && Object.keys(filter).length > 0) {

            // handle filter full name
            if (filter.full_name) {
                filter.full_name = {$regex: filter.full_name, $options: 'i'};
            }


            // handle filter balance
            const fieldBalance = ['withdrawal', 'deposit'];
            fieldBalance.forEach(eachField => {
                if (filter[eachField] !== undefined) {

                    //default operator
                    let operator = filter[eachField];

                    // handle filter balance by range
                    if (filter.balance_range) {
                        if (filter.balance_range === 'less_than') operator = {$lt: filter[eachField]};
                        if (filter.balance_range === 'more_than') operator = {$gt: filter[eachField]};
                    }
                    filter[`balance.${eachField}`] = operator;
                    delete filter[eachField];
                }
            });

            // handle filter createdAt
            if (filter.join_date) {
                // handling iso date problem
                const startDate = moment(filter.join_date, 'YYYY-MM-DD').startOf('month');
                const endDate = moment(filter.join_date, 'YYYY-MM-DD').endOf('month');
                // default operator
                let operator = {
                    $gte: new Date(startDate),
                    $lt: new Date(endDate)
                };
                // handle filter date by range
                if (filter.date_range) {
                    if (filter.date_range === 'less_than') operator = {$lt: new Date(startDate)};
                    if (filter.date_range === 'more_than') operator = {$gt: new Date(endDate)};
                }


                filter.join_date = operator;
            }


            // delete unecessary filter for query to mongoose
            delete filter.date_range;
            delete filter.balance_range;
            queryFilter = filter;
        }


        // handle sorting
        if (sorting && Object.keys(sorting).length > 0) {
            if (sorting.deposits) sorting['balance.deposits'] = sorting.deposits;
            if (sorting.withdrawals) sorting['balance.withdrawals'] = sorting.withdrawals;
            querySorting = sorting;
        }


        const result = await customerModel
            .find(queryFilter)
            .populate('creator')
            .sort(querySorting)
            .skip(skip)
            .limit(limit)
            .lean();

        const amountData = await customerModel.countDocuments({status: queryFilter?.status ?? 'active'});
        return result.map(data => ({
            ...data,
            join_date: moment(data.join_date).format('LL'),
            amount_data: amountData
        }));

    } catch (error) {
        throw {status: 400, message: error.message};
    }
}

async function createDataCustomer(input) {
    try {
        // check input is exist or not
        if (!input || !input.length) throw {status: 400, message: 'need data input'};

        // set for payload, key field is full_name for detect duplicate data
        const allInputNames = input.map(newData => {
            if (!newData.full_name) throw {status: 400, message: 'need data input'};
            return newData.full_name;
        });

        // check the duplicate data
        const foundData = await customerModel.find({full_name: {$in: allInputNames}});
        if (foundData && foundData.length) {
            let messageData = foundData.map(data => data.full_name).join(', ');
            throw {status: 422, message: 'duplicated data detected: ' + messageData};
        }


        // execute for createing data
        await customerModel.create(input);
        return input.length + ' data has been created';
    } catch (error) {
        throw {status: error.status ?? 400, message: error.message};
    }

}

async function deleteDataCustomer(id) {
    try {
        if (!id) throw {status: 400, message: 'need data input'};
        // messages for response
        let message = `'s has been deleted`;
        let updateStatus = 'deleted';

        // check for the current satus
        const checkId = await customerModel.findOne({_id: id});
        if (!checkId) throw {status: 404, message: 'data not found'};

        if (checkId.status === 'deleted') {
            updateStatus = 'active'
            message = `'s has been reactivated`;
        }


        // execute soft delete
        await customerModel.findByIdAndUpdate(id, {
            status: updateStatus
        });

        return checkId.full_name + message;
    } catch (error) {
        throw {status: error.status ?? 400, message: error.message};
    }
}

async function updateDataCustomer(id, input) {
    try {
        if (!id || !input || (input && !Object.keys(input).length)) throw {status: 400, message: 'need data input'};

        // initiate message for response
        let message = `'s has been updated`;
        let objUpdate = {};

        // check every field for update, to handle empty value
        for (const eachInput in input) {
            if (input[eachInput]) objUpdate[eachInput] = input[eachInput];
        }


        // execute update
        const updatedData = await customerModel.findByIdAndUpdate(id, objUpdate, {new: true});
        return updatedData.full_name + message;
    } catch (error) {
        throw {status: error.status ?? 400, message: error.message};
    }
}

async function getProfileCustomer(id) {
    try {
        if (!id) throw {status: 400, message: 'need input id'};
        let customerData = await customerModel.findOne({_id: id}).populate('creator').lean()
        if (!customerData) throw {status: 404, message: 'customer not found'};
        customerData.join_date = moment(customerData.join_date).format('LL');

        let depositData = await depositModel.find({customer: id}).populate('waste_type').sort({deposit_date: -1}).lean();
        if (depositData?.length) {
            depositData = depositData.map(data => ({
                ...data,
                deposit_date: moment(data.deposit_date).format('LL')
            }))
        }


        let withdrawalData = await withdrawalModel.find({customer: id}).sort({createdAt: -1}).lean();
        if (withdrawalData?.length) {
            withdrawalData = withdrawalData.map(data => ({
                ...data,
                createdAt: moment(data.createdAt).format('LL')
            }))
        }


        let result = {
            customerData: customerData,
            allTotalKg: depositData
                .reduce((acc, current) => acc + current.weight, 0) || 0,

            currentTotalKg: depositData
                .filter(data => data.withdrawal_decision === 'ready')
                .reduce((acc, current) => acc + current.weight, 0) || 0,

            currentDepositAmount: depositData
                .filter(data => data.withdrawal_decision === 'ready')
                .reduce((acc, current) => acc + current.amount, 0) || 0,
            lastDataDeposit: depositData[0] || null,

            currentWithdrawalAmount: withdrawalData
                .filter(data => data.createdAt === new Date().getFullYear())
                .reduce((acc, current) => acc + current.amount, 0) || 0,
            lastDataWithdrawal: withdrawalData[0] || null,
        };

        if (result.allTotalKg) result.allTotalKg = formatNumber(result.allTotalKg);
        if (result.currentTotalKg) result.currentTotalKg = formatNumber(result.currentTotalKg);
        if (result.customerData?.balance?.withdrawal) result.customerData.balance.withdrawal = formatNumber(result.customerData.balance.withdrawal);
        if (result.customerData?.balance?.deposit) result.customerData.balance.deposit = formatNumber(result.customerData.balance.deposit);

        return {result};
    } catch (error) {
        throw {status: error.status ?? 400, message: error.message};
    }
}

function formatNumber(value) {
    if (value >= 1000) {
        const thousands = Math.floor(parseFloat(value / 1000).toFixed(1)); // Use toFixed(1) for one decimal place
        return `${thousands}k`;
    } else {
        return `${value}`;
    }
}

module.exports = {
    getDataCustomer,
    deleteDataCustomer,
    createDataCustomer,
    updateDataCustomer,
    getProfileCustomer
};
