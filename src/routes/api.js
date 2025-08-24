const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/applicationController');

const applicationController = new ApplicationController();

// Define routes for PhD application management
router.post('/applications', applicationController.createApplication);
router.get('/applications', applicationController.getAllApplications);
router.get('/applications/:id', applicationController.getApplicationById);
router.put('/applications/:id', applicationController.updateApplication);
router.delete('/applications/:id', applicationController.deleteApplication);

module.exports = router;