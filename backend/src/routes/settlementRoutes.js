const express = require('express');
const { recordSettlement, listSettlements } = require('../controllers/settlementController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', recordSettlement);
router.get('/', listSettlements);

module.exports = router;
