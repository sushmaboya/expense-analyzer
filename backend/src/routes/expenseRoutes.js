const express = require('express');
const { createExpense, getGroupExpenses } = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createExpense);
router.get('/group/:groupId', getGroupExpenses);

module.exports = router;
