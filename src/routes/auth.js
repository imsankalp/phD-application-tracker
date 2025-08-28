const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');

const userController = new UserController();

// User registration route
router.post('/register', userController.register);

// User login route
router.post('/login', userController.login);

// User logout route
router.post('/logout', userController.logout);

// Google OAuth
router.get('/google/initiate', (req, res) => userController.googleInitiate(req, res));
router.get('/google/callback', (req, res) => userController.googleCallback(req, res));

// Profile routes (protected)
router.get('/me', isAuthenticated, (req, res) => userController.getUserProfile(req, res));
router.put('/me', isAuthenticated, (req, res) => userController.updateUserProfile(req, res));

module.exports = router;