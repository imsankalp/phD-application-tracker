const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false, // optional for Google-authenticated users
    },
    googleId: {
        type: String,
        index: true,
        sparse: true,
    },
    googleTokens: {
        accessToken: { type: String },
        refreshToken: { type: String },
        tokenExpiryDate: { type: Date },
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;