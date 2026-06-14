const bcrypt = require('bcryptjs');
const prisma = require('../utils/db');

// Get Profile Info
async function getProfile(req, res) {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error('Get Profile Error:', err);
    return res.status(500).json({ error: 'An error occurred while retrieving profile.' });
  }
}

// Update Profile Info
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, password, avatarUrl } = req.body;

    const dataToUpdate = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'Name cannot be empty.' });
      }
      dataToUpdate.name = name.trim();
    }

    if (avatarUrl !== undefined) {
      dataToUpdate.avatarUrl = avatarUrl.trim();
    }

    if (password !== undefined && password !== '') {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.passwordHash = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    return res.status(200).json({
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update Profile Error:', err);
    return res.status(500).json({ error: 'An error occurred while updating profile.' });
  }
}

// Get Analytics Dashboard Data
async function getAnalytics(req, res) {
  try {
    const userId = req.user.id;

    // 1. Get user's groups
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true }
    });
    
    const groupIds = memberships.map(m => m.groupId);

    if (groupIds.length === 0) {
      return res.status(200).json({
        totalExpenses: 0,
        youOwe: 0,
        youAreOwed: 0,
        monthlyTrend: [],
        categoryData: [],
        groupSummary: [],
        contribution: { paid: 0, share: 0 }
      });
    }

    // 2. Fetch all expenses in user's groups
    const expenses = await prisma.expense.findMany({
      where: { groupId: { in: groupIds } },
      include: {
        shares: true
      }
    });

    // 3. Fetch all settlements in user's groups
    const settlements = await prisma.settlement.findMany({
      where: { groupId: { in: groupIds } }
    });

    // 4. Calculate Net Balances for each group to find Owe vs Owed
    let totalYouOwe = 0;
    let totalYouAreOwed = 0;
    const groupSummary = [];

    // Fetch details of all groups
    const groups = await prisma.group.findMany({
      where: { id: { in: groupIds } },
      include: {
        members: { include: { user: true } }
      }
    });

    // For each group, calculate net balance
    for (const group of groups) {
      const groupExpenses = expenses.filter(e => e.groupId === group.id);
      const groupSettlements = settlements.filter(s => s.groupId === group.id);

      let groupTotal = 0;
      let userPaid = 0;
      let userShare = 0;
      let userSettlementsPaid = 0;
      let userSettlementsReceived = 0;

      groupExpenses.forEach(exp => {
        groupTotal += exp.amount;
        if (exp.paidById === userId) {
          userPaid += exp.amount;
        }
        const userShareItem = exp.shares.find(s => s.userId === userId);
        if (userShareItem) {
          userShare += userShareItem.amount;
        }
      });

      groupSettlements.forEach(sett => {
        if (sett.payerId === userId) {
          userSettlementsPaid += sett.amount;
        }
        if (sett.payeeId === userId) {
          userSettlementsReceived += sett.amount;
        }
      });

      const netBalance = Math.round((userPaid - userShare + userSettlementsPaid - userSettlementsReceived) * 100) / 100;
      if (netBalance > 0.01) {
        totalYouAreOwed += netBalance;
      } else if (netBalance < -0.01) {
        totalYouOwe += Math.abs(netBalance);
      }

      groupSummary.push({
        id: group.id,
        name: group.name,
        description: group.description,
        totalExpenses: groupTotal,
        memberCount: group.members.length,
        userNetBalance: netBalance
      });
    }

    // 5. Calculate monthly trend and category data based on user's share
    const userInvolvedExpenses = expenses.filter(exp => 
      exp.paidById === userId || exp.shares.some(s => s.userId === userId)
    );

    let totalUserExpensesSum = 0;
    let totalPaidSum = 0;
    let totalShareSum = 0;

    const monthlyMap = {};
    const categoryMap = {};

    userInvolvedExpenses.forEach(exp => {
      if (exp.paidById === userId) {
        totalPaidSum += exp.amount;
      }
      const uShare = exp.shares.find(s => s.userId === userId);
      if (uShare) {
        totalShareSum += uShare.amount;
        totalUserExpensesSum += uShare.amount;
      }

      const dateObj = new Date(exp.date);
      const monthStr = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
      const sortKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      
      const shareVal = uShare ? uShare.amount : 0;
      
      if (!monthlyMap[sortKey]) {
        monthlyMap[sortKey] = { month: monthStr, amount: 0, sortKey };
      }
      monthlyMap[sortKey].amount += shareVal;

      const category = exp.category || 'Others';
      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }
      categoryMap[category] += shareVal;
    });

    const monthlyTrend = Object.values(monthlyMap)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(item => ({
        month: item.month,
        amount: Math.round(item.amount * 100) / 100
      }));

    const categoryDataRaw = Object.keys(categoryMap).map(category => ({
      category,
      amount: Math.round(categoryMap[category] * 100) / 100
    }));

    const totalCategoryAmt = categoryDataRaw.reduce((acc, c) => acc + c.amount, 0);
    const categoryData = categoryDataRaw.map(c => ({
      ...c,
      percentage: totalCategoryAmt > 0 ? Math.round((c.amount / totalCategoryAmt) * 100) : 0
    }));

    return res.status(200).json({
      totalExpenses: Math.round(totalUserExpensesSum * 100) / 100,
      youOwe: Math.round(totalYouOwe * 100) / 100,
      youAreOwed: Math.round(totalYouAreOwed * 100) / 100,
      monthlyTrend,
      categoryData,
      groupSummary,
      contribution: {
        paid: Math.round(totalPaidSum * 100) / 100,
        share: Math.round(totalShareSum * 100) / 100
      }
    });
  } catch (err) {
    console.error('Get Analytics Error:', err);
    return res.status(500).json({ error: 'An error occurred while compiling analytics data.' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getAnalytics
};
