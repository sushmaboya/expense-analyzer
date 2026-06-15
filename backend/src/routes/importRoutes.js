const express = require('express');
const multer = require('multer');
const { importExpensesCSV, listImportReports } = require('../controllers/importController');
const authMiddleware = require('../middleware/authMiddleware');

const upload = multer();
const router = express.Router();

router.use(authMiddleware);

router.post('/group/:id', upload.single('file'), importExpensesCSV);
router.get('/reports', listImportReports);

module.exports = router;
