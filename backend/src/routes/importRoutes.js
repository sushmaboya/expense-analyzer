const express = require('express');
const { importExpensesCSV, listImportReports } = require('../controllers/importController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

router.post('/group/:id', importExpensesCSV);
router.get('/reports', listImportReports);

module.exports = router;
