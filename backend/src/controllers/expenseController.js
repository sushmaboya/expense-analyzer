const prisma = require('../utils/db');
const { convertToBaseCurrency, normalizeCurrency, isSupportedCurrency } = require('../utils/currency');

// Create Expense
async function createExpense(req, res) {
  try {
    const { title, amount, currency, category, date, paidById, groupId, splitType, shares } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Expense title is required.' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Expense amount must be a positive number.' });
    }

    if (!paidById || !groupId || !splitType) {
      return res.status(400).json({ error: 'PaidById, groupId, and splitType are required.' });
    }

    if (!['EQUAL', 'EXACT', 'PERCENTAGE'].includes(splitType)) {
      return res.status(400).json({ error: 'Split type must be EQUAL, EXACT, or PERCENTAGE.' });
    }

    const normalizedCurrency = normalizeCurrency(currency || 'INR');
    if (!isSupportedCurrency(normalizedCurrency)) {
      return res.status(400).json({ error: 'Currency must be INR or USD.' });
    }

    const expenseDate = date ? new Date(date) : new Date();
    if (isNaN(expenseDate.getTime())) {
      return res.status(400).json({ error: 'Invalid expense date.' });
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: parseInt(groupId) },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    const findMembership = (userId) => group.members.find(m => m.userId === parseInt(userId));
    const isMemberActiveAt = (membership, dateObj) => {
      if (!membership) return false;
      const joinedAt = new Date(membership.joinedAt);
      const leftAt = membership.leftAt ? new Date(membership.leftAt) : null;
      if (dateObj < joinedAt) return false;
      if (leftAt && dateObj > leftAt) return false;
      return true;
    };

    // Verify paidById is an active member at the expense date
    const payerMembership = findMembership(paidById);
    if (!isMemberActiveAt(payerMembership, expenseDate)) {
      return res.status(400).json({ error: 'Payer must be an active member of the group for the selected expense date.' });
    }

    // Determine target shares
    let calculatedShares = [];
    const activeMembers = group.members.filter(m => isMemberActiveAt(m, expenseDate));

    if (splitType === 'EQUAL') {
      let targetUserIds = [];
      if (!shares || shares.length === 0) {
        targetUserIds = activeMembers.map(m => m.userId);
      } else {
        targetUserIds = shares.map(s => parseInt(s.userId));
      }

      if (targetUserIds.length === 0) {
        return res.status(400).json({ error: 'No active members are available to split with on the selected expense date.' });
      }

      const invalidMember = targetUserIds.find(uId => !activeMembers.some(m => m.userId === uId));
      if (invalidMember) {
        return res.status(400).json({ error: 'One or more split members are not active on the selected expense date.' });
      }

      const count = targetUserIds.length;
      const shareAmount = Math.round((numericAmount / count) * 100) / 100;
      const baseShare = Math.round((convertToBaseCurrency(numericAmount, normalizedCurrency) / count) * 100) / 100;

      targetUserIds.forEach((uId, idx) => {
        const finalShare = idx === count - 1 ? (numericAmount - shareAmount * (count - 1)) : shareAmount;
        const finalBaseShare = idx === count - 1 ? (convertToBaseCurrency(numericAmount, normalizedCurrency) - baseShare * (count - 1)) : baseShare;
        calculatedShares.push({
          userId: uId,
          amount: Math.round(finalShare * 100) / 100,
          amountInBase: Math.round(finalBaseShare * 100) / 100,
          percentage: Math.round((100 / count) * 100) / 100
        });
      });

    } else if (splitType === 'EXACT') {
      if (!shares || shares.length === 0) {
        return res.status(400).json({ error: 'Shares are required for EXACT split.' });
      }

      let sumShares = 0;
      const activeUserIds = new Set(activeMembers.map(m => m.userId));

      for (const share of shares) {
        const userId = parseInt(share.userId);
        const shareAmount = parseFloat(share.amount);

        if (!activeUserIds.has(userId)) {
          return res.status(400).json({ error: 'One or more split members are not active on the selected expense date.' });
        }
        if (isNaN(shareAmount) || shareAmount < 0) {
          return res.status(400).json({ error: 'Exact split shares must be valid non-negative numbers.' });
        }

        sumShares += shareAmount;
        calculatedShares.push({
          userId,
          amount: Math.round(shareAmount * 100) / 100,
          amountInBase: Math.round((convertToBaseCurrency(shareAmount, normalizedCurrency) / numericAmount) * convertToBaseCurrency(numericAmount, normalizedCurrency) * 100) / 100,
          percentage: null
        });
      }

      sumShares = Math.round(sumShares * 100) / 100;
      const targetAmt = Math.round(numericAmount * 100) / 100;
      if (Math.abs(sumShares - targetAmt) > 0.05) {
        return res.status(400).json({ error: `Sum of exact split amounts (${sumShares}) does not match expense amount (${targetAmt}).` });
      }

    } else if (splitType === 'PERCENTAGE') {
      if (!shares || shares.length === 0) {
        return res.status(400).json({ error: 'Shares are required for PERCENTAGE split.' });
      }

      let sumPercentage = 0;
      const activeUserIds = new Set(activeMembers.map(m => m.userId));

      shares.forEach((s) => {
        const userId = parseInt(s.userId);
        const pct = parseFloat(s.percentage);
        if (!activeUserIds.has(userId)) {
          return;
        }
        sumPercentage += pct;

        const shareAmt = Math.round(((pct / 100) * numericAmount) * 100) / 100;
        const shareBaseAmt = Math.round(((pct / 100) * convertToBaseCurrency(numericAmount, normalizedCurrency)) * 100) / 100;
        calculatedShares.push({
          userId,
          amount: shareAmt,
          amountInBase: shareBaseAmt,
          percentage: pct
        });
      });

      if (calculatedShares.length !== shares.length) {
        return res.status(400).json({ error: 'One or more split members are not active on the selected expense date.' });
      }

      sumPercentage = Math.round(sumPercentage * 100) / 100;
      if (Math.abs(sumPercentage - 100) > 0.01) {
        return res.status(400).json({ error: `Sum of percentages (${sumPercentage}%) does not equal 100%.` });
      }

      const currentSum = calculatedShares.reduce((acc, s) => acc + s.amount, 0);
      const diff = numericAmount - currentSum;
      if (Math.abs(diff) > 0 && calculatedShares.length > 0) {
        calculatedShares[calculatedShares.length - 1].amount = Math.round((calculatedShares[calculatedShares.length - 1].amount + diff) * 100) / 100;
      }

      const currentBaseSum = calculatedShares.reduce((acc, s) => acc + s.amountInBase, 0);
      const baseDiff = convertToBaseCurrency(numericAmount, normalizedCurrency) - currentBaseSum;
      if (Math.abs(baseDiff) > 0 && calculatedShares.length > 0) {
        calculatedShares[calculatedShares.length - 1].amountInBase = Math.round((calculatedShares[calculatedShares.length - 1].amountInBase + baseDiff) * 100) / 100;
      }
    }

    // Verify all share users are active members on the expense date
    const activeIds = new Set(activeMembers.map(m => m.userId));
    for (let s of calculatedShares) {
      if (!activeIds.has(s.userId)) {
        return res.status(400).json({ error: `User with ID '${s.userId}' in split details is not active in the group for this expense date.` });
      }
    }

    // Write expense & shares inside transaction
    const newExpense = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          title: title.trim(),
          amount: numericAmount,
          currency: normalizedCurrency,
          amountInBase: convertToBaseCurrency(numericAmount, normalizedCurrency),
          category: category ? category.trim() : 'Others',
          date: expenseDate,
          paidById: parseInt(paidById),
          groupId: parseInt(groupId),
          splitType
        }
      });

      // Create shares
      await Promise.all(
        calculatedShares.map(s =>
          tx.expenseShare.create({
            data: {
              expenseId: expense.id,
              userId: s.userId,
              amount: s.amount,
              amountInBase: s.amountInBase ?? Math.round((s.amount / numericAmount) * convertToBaseCurrency(numericAmount, normalizedCurrency) * 100) / 100,
              percentage: s.percentage
            }
          })
        )
      );

      return tx.expense.findUnique({
        where: { id: expense.id },
        include: {
          shares: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true
                }
              }
            }
          },
          paidBy: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      });
    });

    return res.status(201).json({
      message: 'Expense added successfully!',
      expense: newExpense
    });
  } catch (err) {
    console.error('Create Expense Error:', err);
    return res.status(500).json({ error: 'An error occurred while creating expense.' });
  }
}

// Get group expenses
async function getGroupExpenses(req, res) {
  try {
    const groupId = parseInt(req.params.groupId);

    if (isNaN(groupId)) {
      return res.status(400).json({ error: 'Invalid group ID.' });
    }

    const expenses = await prisma.expense.findMany({
      where: { groupId },
      orderBy: { date: 'desc' },
      include: {
        paidBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        shares: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    return res.status(200).json(expenses);
  } catch (err) {
    console.error('Get Group Expenses Error:', err);
    return res.status(500).json({ error: 'An error occurred while retrieving expenses.' });
  }
}

module.exports = {
  createExpense,
  getGroupExpenses
};
