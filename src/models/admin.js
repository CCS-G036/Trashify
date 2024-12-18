const mongoose = require('mongoose');
// initiate schema
const userSchema = new mongoose.Schema({
    full_name: {
        type: String,
        required: true,
        lowercase: true
    },
    username: {
        type: String,
        unique: true,
        required: true,
        lowercase: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'deleted'],
        default: 'active'
    }
}, {
    timestamps: true
});

// from schema to model
const User = mongoose.model('user', userSchema);
module.exports = User; 