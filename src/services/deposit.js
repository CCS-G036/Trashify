require('dotenv').config();
const depositModel = require('../models/deposit');
const wasteTypeModel = require('../models/wasteType');
const customerModel = require('../models/customer');
const moment = require('moment');

async function getDataDeposit(filter, sorting, pagination) {
    try {
        // initiate variables
        let queryAggregate = [];
        if (pagination?.page > 0) pagination.page -= 1;
        const limit = pagination && pagination.limit || 10;
        const skip = limit * (pagination && pagination.page || 0);
        const refCollection = ['customer', 'waste_type'];
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
            // handle filter for chart deposit
            if (filter.deposit_chart) {
                const startCurrentDate = moment(filter.deposit_chart).startOf('year');
                const endCurrentDate = moment(filter.deposit_chart).endOf('year');
                const operatorCurrentDate = {
                    $gte: new Date(startCurrentDate),
                    $lt: new Date(endCurrentDate)
                };

                queryAggregate.push({
                    $match: {deposit_date: operatorCurrentDate}
                });
            }


            // handle filter that contains ref to another collection
            if (filter.customer) {
                if (!filter.customer) throw {status: 400, message: 'only full_name for filter customer'};
                // for customer in deposit, only full name
                queryAggregate.push(
                    {
                        $match:
                            {'customer_populate.full_name': {$regex: filter.customer, $options: 'i'}}
                    });
            }
            if (filter.waste_type) {
                // for waste type in deposit only fields name and price(with range_price for optional)
                let queryMatch = {
                    $match: {}
                };

                // for collection waste_type only name and price(with range)
                let valueMatch = {};
                if (filter.waste_type.name) {
                    valueMatch = {$regex: filter.waste_type.name, $options: 'i'};
                    queryMatch.$match['waste_type_populate.name'] = valueMatch;
                }


                if (filter.waste_type.price) {
                    valueMatch = filter.waste_type.price;
                    if (filter.waste_type.price_range === 'more_than') valueMatch = {$gt: filter.waste_type.price};
                    if (filter.waste_type.price_range === 'less_than') valueMatch = {$lt: filter.waste_type.price};
                    queryMatch.$match['waste_type_populate.price'] = valueMatch;
                }


                queryAggregate.push(queryMatch);
            }
            // if filter not related to another collection, but ranged for date and numbers
            if (filter.weight) {
                let queryMatch = {
                    $match: {}
                };
                queryMatch.$match.weight = +filter.weight;
                if (filter.weight_range === 'more_than') queryMatch.$match.weight = {$gt: filter.weight};
                if (filter.weight_range === 'less_than') queryMatch.$match.weight = {$lt: filter.weight};
                queryAggregate.push(queryMatch);
            }


            if (filter.amount) {
                let queryMatch = {
                    $match: {}
                };
                queryMatch.$match.amount = +filter.amount;
                if (filter.amount_range === 'more_than') queryMatch.$match.amount = {$gt: filter.amount};
                if (filter.amount_range === 'less_than') queryMatch.$match.amount = {$lt: filter.amount};
                queryAggregate.push(queryMatch);
            }


            if (filter.deposit_date) {
                let queryMatch = {
                    $match: {}
                };
                // for deposit_date only for per month
                const startDate = moment(filter.deposit_date, 'YYYY-MM-DD').startOf('month');
                const endDate = moment(filter.deposit_date, 'YYYY-MM-DD').endOf('month');

                let operator = {
                    $gte: new Date(startDate),
                    $lt: new Date(endDate)
                };

                queryMatch.$match.deposit_date = operator;
                if (filter.date_range === 'more_than') queryMatch.$match.deposit_date = {$gt: new Date(endDate)};
                if (filter.date_range === 'less_than') queryMatch.$match.deposit_date = {$lt: new Date(startDate)};
                queryAggregate.push(queryMatch);
            }


            if (filter.status) {
                let queryMatch = {
                    $match: {}
                };
                queryMatch.$match.status = filter.status;
                queryAggregate.push(queryMatch);
            }


            if (filter.withdrawal_status) {
                let queryMatch = {
                    $match: {}
                };
                queryMatch.$match.withdrawal_status = filter.withdrawal_status;
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
                } else if (eachSorting === 'waste_type') {
                    // set value asc or desc
                    sortValue = sorting.waste_type.name = sorting[eachSorting] === 'asc' ? 1 : sorting[eachSorting];
                    // set field to lower
                    queryAddFields.$addFields.sortField.$toLower = 'waste_type_populate.name';
                    // set field that want to sorting
                    querySort.$sort['waste_type_populate.name'] = sortValue;
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
                $set: {customer: '$customer_populate', waste_type: '$waste_type_populate'}
            },
            {
                $project: {'customer_populate': 0, 'waste_type_populate': 0}
            }
        );
        const result = await depositModel
            .aggregate(queryAggregate)
            .skip(skip)
            .limit(limit);

        const amountData = await depositModel.countDocuments({status: filter?.status ?? 'active'});
        return result.map(data => ({
            ...data,
            deposit_date: moment(data.deposit_date).format('LL'),
            amount_data: amountData
        }));

    } catch (error) {
        throw {status: 400, message: error.message};
    }
}

async function createDataDeposit(input) {
    try {

        // check input is exist or not
        if (!input || !input.length) throw {status: 400, message: 'need data input'};

        // check all input of wasteType and customer is available or not
        for (const eachInput of input) {
            // getData wastetType and customer
            const getDataWasteType = await wasteTypeModel.findById(eachInput.waste_type).lean();
            const getDataCustomer = await customerModel.findById(eachInput.customer).lean();

            if (!getDataWasteType || getDataWasteType.status === 'deleted') throw {
                status: 404,
                message: 'waste type not found'
            };
            if (!getDataCustomer || getDataCustomer.status === 'deleted') throw {
                status: 404,
                message: 'customer not found'
            };

            // calculate total amount for update customer balance
            eachInput.amount = getDataWasteType.price * eachInput.weight;
        }


        // save the checked data to database
        for (const eachInput of input) {
            // execute for createing data deposit and update balance user
            await depositModel.create(eachInput);
            await customerModel.findByIdAndUpdate(eachInput.customer, {$inc: {'balance.deposit': eachInput.amount}});
            await wasteTypeModel.findByIdAndUpdate(eachInput.waste_type, {$inc: {deposit_count: 1}});
        }


        return input.length + ' data has been created';
    } catch (error) {
        throw {status: error.status ?? 400, message: error.message};
    }
}

async function deleteDataDeposit(id) {
    try {
        // messages for response
        if (!id) throw {status: 400, message: 'need data input'};

        // check for the current status, with customer too
        const getDataDeposit = await depositModel.findById(id);
        const getDataCustomer = await customerModel.findById(getDataDeposit.customer);
        if (!getDataDeposit) throw {status: 404, message: 'data not found'};
        if (getDataDeposit && getDataDeposit.status === 'deleted') throw {status: 400, message: 'already deleted'};
        if (!getDataCustomer) throw {status: 404, message: 'data customer not found'};

        // execute soft delete
        await depositModel.findByIdAndUpdate(id,
            {status: 'deleted',}
        );

        await wasteTypeModel.findByIdAndUpdate(getDataDeposit.waste_type,
            {$inc: {deposit_count: -1}}
        );

        // update balance customer
        await customerModel.findByIdAndUpdate(getDataCustomer._id,
            {
                $inc: {'balance.deposit': -getDataDeposit.amount}
            });

        return `the data has been deleted`;
    } catch (error) {
        throw {status: error.status ?? 400, message: error.message};
    }
}

module.exports = {
    createDataDeposit,
    deleteDataDeposit,
    getDataDeposit
};