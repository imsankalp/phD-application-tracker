const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/applicationController');
const { isAuthenticated } = require('../middleware/auth');

const applicationController = new ApplicationController();

// Define routes for PhD application management
router.post('/applications', isAuthenticated, (req, res) => applicationController.createApplication(req, res));
router.get('/applications', isAuthenticated, (req, res) => applicationController.getAllApplications(req, res));
router.get('/applications/:id', isAuthenticated, (req, res) => applicationController.getApplicationById(req, res));
router.put('/applications/:id', isAuthenticated, (req, res) => applicationController.updateApplication(req, res));
router.delete('/applications/:id', isAuthenticated, (req, res) => applicationController.deleteApplication(req, res));

// Gmail sync endpoint
router.post('/applications/sync', isAuthenticated, (req, res) => applicationController.syncFromGmail(req, res));

module.exports = router;