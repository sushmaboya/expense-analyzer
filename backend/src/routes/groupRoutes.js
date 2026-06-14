const express = require('express');
const { createGroup, listGroups, addGroupMember, removeGroupMember } = require('../controllers/groupController');
const { getGroupBalancesAndSettlements } = require('../controllers/settlementController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createGroup);
router.get('/', listGroups);
router.post('/:id/members', addGroupMember);
router.delete('/:id/members/:userId', removeGroupMember);
router.get('/:id/balances', getGroupBalancesAndSettlements);

module.exports = router;
