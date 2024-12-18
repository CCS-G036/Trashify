const mongoose = require('mongoose');

// initiate schema
const wasteTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    price: {
        type: Number,
        min: [0, 'price must be at least 0'],
        required: true
    },
    deposit_count: {
        type: Number,
        min: [0, 'deposit_count must be at least 0'],
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'deleted'],
        default: 'active'
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
}, {timestamps: true});

// from schema to model
const WasteType = mongoose.model('waste_type', wasteTypeSchema);
module.exports = WasteType;
