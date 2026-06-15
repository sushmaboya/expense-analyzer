const express = require('express');
const { createExpense, getGroupExpenses, updateExpense, deleteExpense } = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
router.get('/group/:groupId', getGroupExpenses);

module.exports = router;
