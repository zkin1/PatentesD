const express = require('express');
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, userController.getAllUsers);
router.get('/:id', authenticateToken, userController.getUser);
router.put('/:id', authenticateToken, userController.updateUser);

module.exports = router;