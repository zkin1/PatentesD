const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const authenticateToken = require('../middleware/auth');

router.get('/patente/:numeroPatente', authenticateToken, searchController.searchByPatente);
router.post('/consultasRegistradas', authenticateToken, searchController.registerSearch);
router.get('/consultasRegistradas', authenticateToken, searchController.getAllSearches);
router.get('/verify/:numeroPatente', searchController.verifyPatente);

module.exports = router;