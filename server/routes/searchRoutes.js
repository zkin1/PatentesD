const express = require('express');
const searchController = require('../controllers/searchController');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.get('/patente/:numeroPatente', authenticateToken, searchController.searchByPatente);
router.post('/register', authenticateToken, searchController.registerSearch);
router.get('/all', authenticateToken, searchController.getAllSearches);
router.get('/verify/:numeroPatente', searchController.verifyPatente);

module.exports = router;