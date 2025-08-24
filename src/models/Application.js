const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    applicantName: {
        type: String,
        required: true
    },
    university: {
        type: String,
        required: true
    },
    program: {
        type: String,
        required: true
    },
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
    }
});

module.exports = mongoose.model('Application', applicationSchema);