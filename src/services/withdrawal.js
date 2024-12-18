require('dotenv').config();
const depositModel = require('../models/deposit');
const withdrawalModel = require('../models/withdrawal');
const customerModel = require('../models/customer');
const moment = require('moment');

async function getDataWithdrawal(filter, sorting, pagination) {
    try {
        // initiate query for aggregate
        let queryAggregate = [];
        if (pagination?.page > 0) pagination.page -= 1;
        const limit = pagination && pagination.limit || 10;
        const skip = limit * (pagination && pagination.page || 0);
        const refCollection = ['customer', 'deposit'];

        // for default, lookup the other collections
        for (const eachCollection of refCollection) {
            queryAggregate.push({
                $lookup: {
                    from: eachCollection + 's', // collection name
                    localField: eachCollection,
                    foreignField: '_id',
                    as: eachCollection + '_populate'
                }
            }, {
                $unwind: '$' + eachCollection + '_populate'
            });
        }


        // handle filter
        if (filter && Object.keys(filter).length > 0) {
            // handle filter that contains ref to another collection
            if (filter.customer) {
                if (!filter.customer) throw {status: 400, message: 'only full_name for filter customer'};
                // for customer in withdrawal, only full name
                queryAggregate.push(
                    {
                        $match:
                            {'customer_populate.full_name': {$regex: filter.customer, $options: 'i'}}
                    });
            }


            //  filter amount
            if (filter.amount || filter.amount !== undefined) {
                // for waste type in deposit only fields name and price(with range_price for optional)
                let queryMatch = {
                    $match: {}
                };

                // for collection waste_type only name and price(with range)
                let valueMatch = +filter.amount;
                if (filter.amount_range === 'more_than') valueMatch = {$gt: filter.amount};
                if (filter.amount_range === 'less_than') valueMatch = {$lt: filter.amount};
                queryMatch.$match.amount = valueMatch;
                queryAggregate.push(queryMatch);
            }


            //  filter amount
            if (filter.createdAt) {
                // for waste type in deposit only fields name and price(with range_price for optional)
                let queryMatch = {
                    $match: {}
                };

                // get only month from date
                const startDate = moment(filter.createdAt, 'YYYY-MM-DD').startOf('month');
                const endDate = moment(filter.createdAt, 'YYYY-MM-DD').endOf('month');

                let operator = {
                    $gte: new Date(startDate),
                    $lt: new Date(endDate)
                };

                // for collection waste_type only name and price(with range)
                let valueMatch = operator;
                if (filter.date_range === 'more_than') valueMatch = {$gt: new Date(endDate)};
                if (filter.date_range === 'less_than') valueMatch = {$lt: new Date(startDate)};
                queryMatch.$match.createdAt = valueMatch;
                queryAggregate.push(queryMatch);
            }


            // filter status
            if (filter.status) {
                let queryMatch = {
                    $match: {}
                };
                queryMatch.$match.status = filter.status;
                queryAggregate.push(queryMatch);
            }

        }


        // handle sorting
        if (sorting && Object.keys(sorting).length > 0) {
            // initiate for conver to lower case
            let queryAddFields = {
                $addFields: {
                    sortField: {$toLower: ''}
                }
            };

            // initiate for query sorting
            let querySort = {$sort: {}};

            for (const eachSorting in sorting) {
                if (!sorting[eachSorting]) throw {status: 400, message: 'sorting ' + eachSorting + ' is empty'};
                let sortValue = sorting[eachSorting] === 'asc' ? 1 : sorting[eachSorting];

                if (eachSorting === 'customer') {
                    // set value asc or desc
                    sortValue = sorting.customer.full_name = sorting[eachSorting] === 'asc' ? 1 : sorting[eachSorting];
                    // set field to lower
                    queryAddFields.$addFields.sortField.$toLower = 'customer_populate.full_name';
                    // set field that want to sorting
                    querySort.$sort['customer_populate.full_name'] = sortValue;
                } else {
                    queryAddFields.$addFields.sortField.$toLower = eachSorting;
                    querySort.$sort[eachSorting] = sortValue;
                }

                // push to queryAggregate
                queryAggregate.push(queryAddFields, querySort);
            }
        }


        // dont display the old populate data
        queryAggregate.push(
            {
                $set: {customer: '$customer_populate', deposit: '$deposit_populate'}
            },
            {
                $project: {'customer_populate': 0, 'deposit_populate': 0}
            }
        );

        const result = await withdrawalModel
            .aggregate(queryAggregate)
            .skip(skip)
            .limit(limit);

        const amountData = await withdrawalModel.countDocuments({status: filter?.status ?? 'active'});
        return result.map(data => ({
            ...data,
            createdAt: moment(data.createdAt).format('LL'),
            amount_data: amountData
        }));


    } catch (error) {
        throw {status: 400, message: error.message};
    }
}

async function createDataWithdrawal(date, creatorId) {
    try {
        const checkMonth = moment().format('MMMM');
        if (checkMonth !== 'December') throw {status: 404, message: 'withdrawal only in December'};
        const startDate = moment(date, 'YYYY-MM-DD').startOf('month');
        const endDate = moment(date, 'YYYY-MM-DD').endOf('month');

        let operator = {
            $gte: new Date(startDate),
            $lt: new Date(endDate)
        };

        // find the data with filter, data withdrawals should be generated per customer
        const dataDeposit = await depositModel.aggregate([{
            $lookup: {
                from: 'customers',
                localField: 'customer',
                foreignField: '_id',
                as: 'customer_populate'
            }
        },
            {
                $unwind: '$customer_populate'
            },
            {
                $match: {
                    withdrawal_status: 'ready',
                    status: 'active',
                    // deposit_date: operator,
                    'customer_populate.withdrawal_decision': 'Yes'
                }
            }
        ]);

        if (!dataDeposit || !dataDeposit.length) throw {status: 404, message: 'Data is not found'};

        // update for each collection that related
        for (const eachDeposit of dataDeposit) {
            // save to db
            await withdrawalModel.create({
                amount: eachDeposit.amount,
                customer: eachDeposit.customer,
                deposit: eachDeposit._id,
                creator: creatorId
            });

            // update deposit status
            await depositModel.findByIdAndUpdate(eachDeposit._id,
                {withdrawal_status: 'done'}
            );

            // update balance withdrawal for customer
            await customerModel.findByIdAndUpdate(eachDeposit.customer,
                {
                    $inc: {
                        'balance.withdrawal': eachDeposit.amount,
                    }
                }
            );

            // update balance deposit for customer
            await customerModel.findByIdAndUpdate(eachDeposit.customer,
                {
                    $inc: {
                        'balance.deposit': -eachDeposit.amount,
                    }
                }
            );
        }

        return dataDeposit.length + ' data has been created';
    } catch (error) {
        throw {status: error.status ?? 400, message: error.message};
    }
}

async function deleteDataWithdrawal(id, reason) {
    try {
        // messages for response
        if (!id) throw {status: 400, message: 'need data input'};

        // check for the current status, with customer too
        const getDataWithdrawal = await withdrawalModel.findById(id);
        const getDataCustomer = await customerModel.findById(getDataWithdrawal.customer);
        if (!getDataWithdrawal) throw {status: 404, message: 'data not found'};
        if (getDataWithdrawal && getDataWithdrawal.status === 'deleted') throw {
            status: 400,
            message: 'already deleted'
        };
        if (!getDataCustomer) throw {status: 404, message: 'data customer not found'};

        //  roll back the status of deposit
        await depositModel.findByIdAndUpdate(getDataWithdrawal.deposit,
            {
                withdrawal_status: 'ready'
            });


        // update balance customer
        await customerModel.findByIdAndUpdate(getDataCustomer._id,
            {
                $inc: {
                    'balance.withdrawal': -getDataWithdrawal.amount,
                }
            });

        // update balance customer
        await customerModel.findByIdAndUpdate(getDataCustomer._id,
            {
                $inc: {
                    'balance.deposit': getDataWithdrawal.amount,
                }
            });

        // rollback the amount and set status deleted and the reason
        await withdrawalModel.findByIdAndUpdate(getDataWithdrawal._id,
            {
                status: 'deleted',
                delete_reason: reason
            });

        return `the data has been deleted`;
    } catch (error) {
        throw {status: error.status ?? 400, message: error.message};
    }
}

module.exports = {
    createDataWithdrawal,
    deleteDataWithdrawal,
    getDataWithdrawal
};