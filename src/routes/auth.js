const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

const userController = new UserController();

// User registration route
router.post('/register', userController.register);

// User login route
router.post('/login', userController.login);

// User logout route
router.post('/logout', userController.logout);

module.exports = router;