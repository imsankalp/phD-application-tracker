const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    applicantName: {
        type: String,
        required: false
    },
    university: {
        type: String,
        required: false
    },
    program: {
        type: String,
        required: false
    },
    applicationId: { type: String },
    applicationStatus: {
        type: String,
        enum: ['Submitted', 'Under Review', 'Accepted', 'Rejected'],
        default: 'Submitted'
    },
    interviewDate: {
        type: Date,
        default: null
    },
    submissionDate: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        default: ''
    },
    sourceEmailId: { type: String, index: true },
});

module.exports = mongoose.model('Application', applicationSchema);