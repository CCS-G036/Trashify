const mongoose = require('mongoose');
// initiate schema
const depositSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: [0, 'Amount must be at least 0'],
        default: 0
    },
    weight: {
        type: Number,
        required: true,
        min: [0, 'Amount must be at least 0'],
        default: 0
    },
    waste_type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'waste_type',
        required: true
    },
    withdrawal_status: {
        type: String,
        enum: ['done', 'ready'],
        default: 'ready'
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customer',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'deleted'],
        default: 'active'
    },
    deposit_date: {
        type: Date,
        default: new Date()
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
});

// from schema to model
const Deposit = mongoose.model('deposit', depositSchema);
module.exports = Deposit; 