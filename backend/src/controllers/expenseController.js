const prisma = require('../utils/db');

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

    // Verify paidById is a member
    const isPayerMember = group.members.some(m => m.userId === parseInt(paidById));
    if (!isPayerMember) {
      return res.status(400).json({ error: 'Payer must be a member of the group.' });
    }

    // Determine target shares
    let calculatedShares = [];

    if (splitType === 'EQUAL') {
      // If shares array is empty or not provided, split among all group members
      let targetUserIds = [];
      if (!shares || shares.length === 0) {
        targetUserIds = group.members.map(m => m.userId);
      } else {
        targetUserIds = shares.map(s => parseInt(s.userId));
      }

      if (targetUserIds.length === 0) {
        return res.status(400).json({ error: 'No members specified to split with.' });
      }

      const count = targetUserIds.length;
      const shareAmount = Math.round((numericAmount / count) * 100) / 100;
      
      targetUserIds.forEach((uId, idx) => {
        // Adjust the last share to ensure exact sum matches amount
        const finalShare = idx === count - 1 ? (numericAmount - shareAmount * (count - 1)) : shareAmount;
        calculatedShares.push({
          userId: uId,
          amount: Math.round(finalShare * 100) / 100,
          percentage: Math.round((100 / count) * 100) / 100
        });
      });

    } else if (splitType === 'EXACT') {
      if (!shares || shares.length === 0) {
        return res.status(400).json({ error: 'Shares are required for EXACT split.' });
      }

      let sumShares = 0;
      shares.forEach(s => {
        sumShares += parseFloat(s.amount);
        calculatedShares.push({
          userId: parseInt(s.userId),
          amount: parseFloat(s.amount),
          percentage: null
        });
      });

      // Verify exact sum matches amount
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
      shares.forEach(s => {
        const pct = parseFloat(s.percentage);
        sumPercentage += pct;
        
        const shareAmt = Math.round(((pct / 100) * numericAmount) * 100) / 100;
        calculatedShares.push({
          userId: parseInt(s.userId),
          amount: shareAmt,
          percentage: pct
        });
      });

      // Verify percentages sum to 100
      sumPercentage = Math.round(sumPercentage * 100) / 100;
      if (Math.abs(sumPercentage - 100) > 0.01) {
        return res.status(400).json({ error: `Sum of percentages (${sumPercentage}%) does not equal 100%.` });
      }

      // Adjust the last share to ensure exact sum matches amount
      const currentSum = calculatedShares.reduce((acc, s) => acc + s.amount, 0);
      const diff = numericAmount - currentSum;
      if (Math.abs(diff) > 0 && calculatedShares.length > 0) {
        calculatedShares[calculatedShares.length - 1].amount = Math.round((calculatedShares[calculatedShares.length - 1].amount + diff) * 100) / 100;
      }
    }

    // Verify all share users are members of the group
    const memberIdSet = new Set(group.members.map(m => m.userId));
    for (let s of calculatedShares) {
      if (!memberIdSet.has(s.userId)) {
        return res.status(400).json({ error: `User with ID '${s.userId}' in split details is not a member of this group.` });
      }
    }

    // Write expense & shares inside transaction
    const newExpense = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          title: title.trim(),
          amount: numericAmount,
          currency: currency ? currency.toUpperCase().trim() : 'INR',
          category: category ? category.trim() : 'Others',
          date: date ? new Date(date) : new Date(),
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
