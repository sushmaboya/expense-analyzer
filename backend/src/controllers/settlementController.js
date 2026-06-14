const prisma = require('../utils/db');
const { calculateGroupBalances, minimizeTransactions } = require('../utils/settlementEngine');

// Record a manual settlement payment
async function recordSettlement(req, res) {
  try {
    const { groupId, payerId, payeeId, amount, date } = req.body;

    if (!groupId || !payerId || !payeeId || !amount) {
      return res.status(400).json({ error: 'GroupId, payerId, payeeId, and amount are required.' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Settlement amount must be a positive number.' });
    }

    if (parseInt(payerId) === parseInt(payeeId)) {
      return res.status(400).json({ error: 'Payer and payee cannot be the same user.' });
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: parseInt(groupId) },
      include: {
        members: true
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    // Check if both payer and payee are members of the group
    const memberIds = new Set(group.members.map(m => m.userId));
    if (!memberIds.has(parseInt(payerId))) {
      return res.status(400).json({ error: 'Payer must be a member of this group.' });
    }
    if (!memberIds.has(parseInt(payeeId))) {
      return res.status(400).json({ error: 'Payee must be a member of this group.' });
    }

    // Create the settlement
    const settlement = await prisma.settlement.create({
      data: {
        groupId: parseInt(groupId),
        payerId: parseInt(payerId),
        payeeId: parseInt(payeeId),
        amount: numericAmount,
        date: date ? new Date(date) : new Date()
      },
      include: {
        payer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        payee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.status(201).json({
      message: 'Settlement recorded successfully!',
      settlement
    });
  } catch (err) {
    console.error('Record Settlement Error:', err);
    return res.status(500).json({ error: 'An error occurred while recording settlement.' });
  }
}

// Fetch settlements (optional filter by groupId, otherwise settlements for logged-in user)
async function listSettlements(req, res) {
  try {
    const userId = req.user.id;
    const { groupId } = req.query;

    const whereClause = {};

    if (groupId) {
      whereClause.groupId = parseInt(groupId);
    } else {
      // Return settlements where current user is payer OR payee
      whereClause.OR = [
        { payerId: userId },
        { payeeId: userId }
      ];
    }

    const settlements = await prisma.settlement.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        payer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        payee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.status(200).json(settlements);
  } catch (err) {
    console.error('List Settlements Error:', err);
    return res.status(500).json({ error: 'An error occurred while fetching settlements.' });
  }
}

// Get group balances and suggested minimized settlements
async function getGroupBalancesAndSettlements(req, res) {
  try {
    const groupId = parseInt(req.params.id);

    if (isNaN(groupId)) {
      return res.status(400).json({ error: 'Invalid group ID.' });
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    const balances = await calculateGroupBalances(groupId);
    const suggestedSettlements = minimizeTransactions(balances);

    return res.status(200).json({
      balances,
      suggestedSettlements
    });
  } catch (err) {
    console.error('Get Balances Error:', err);
    return res.status(500).json({ error: 'An error occurred while calculating balances.' });
  }
}

module.exports = {
  recordSettlement,
  listSettlements,
  getGroupBalancesAndSettlements
};
