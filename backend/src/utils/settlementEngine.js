const prisma = require('./db');

/**
 * Calculates the net balance for all members of a group.
 * A positive balance means the user is owed money (creditor).
 * A negative balance means the user owes money (debtor).
 * 
 * Balance = (Paid Expenses) - (Expense Shares) + (Paid Settlements) - (Received Settlements)
 */
async function calculateGroupBalances(groupId) {
  // Get all members of the group
  const members = await prisma.groupMember.findMany({
    where: { groupId: parseInt(groupId) },
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
  });

  const balances = {};
  members.forEach(member => {
    balances[member.userId] = {
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      avatarUrl: member.user.avatarUrl,
      paid: 0,
      share: 0,
      settlementsPaid: 0,
      settlementsReceived: 0,
      netBalance: 0
    };
  });

  // 1. Sum up all expenses paid by each user in the group
  const expenses = await prisma.expense.findMany({
    where: { groupId: parseInt(groupId) },
    include: {
      shares: true
    }
  });

  expenses.forEach(expense => {
    if (balances[expense.paidById]) {
      balances[expense.paidById].paid += expense.amount;
    }
    
    // 2. Sum up expense shares for each user in the group
    expense.shares.forEach(share => {
      if (balances[share.userId]) {
        balances[share.userId].share += share.amount;
      }
    });
  });

  // 3. Sum up settlements paid and received in the group
  const settlements = await prisma.settlement.findMany({
    where: { groupId: parseInt(groupId) }
  });

  settlements.forEach(settlement => {
    if (balances[settlement.payerId]) {
      balances[settlement.payerId].settlementsPaid += settlement.amount;
    }
    if (balances[settlement.payeeId]) {
      balances[settlement.payeeId].settlementsReceived += settlement.amount;
    }
  });

  // 4. Calculate Net Balance for each user
  // Net = (Paid - Share) + (SettlementsPaid - SettlementsReceived)
  const result = [];
  Object.keys(balances).forEach(userId => {
    const u = balances[userId];
    // Keep double precision floating point rounded to 2 decimal places to avoid standard JS float errors
    u.netBalance = Math.round((u.paid - u.share + u.settlementsPaid - u.settlementsReceived) * 100) / 100;
    result.push(u);
  });

  return result;
}

/**
 * Computes a list of minimal transactions to settle all debts in the group.
 * Greedy algorithm: match largest debtor with largest creditor.
 */
function minimizeTransactions(memberBalances) {
  const creditors = [];
  const debtors = [];

  memberBalances.forEach(m => {
    if (m.netBalance > 0.01) {
      creditors.push({
        userId: m.userId,
        name: m.name,
        email: m.email,
        amount: m.netBalance
      });
    } else if (m.netBalance < -0.01) {
      debtors.push({
        userId: m.userId,
        name: m.name,
        email: m.email,
        amount: Math.abs(m.netBalance)
      });
    }
  });

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];

  let i = 0; // index for debtors
  let j = 0; // index for creditors

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amountToSettle = Math.min(debtor.amount, creditor.amount);
    
    // Create transaction (rounded to 2 decimal places)
    transactions.push({
      fromUserId: debtor.userId,
      fromName: debtor.name,
      fromEmail: debtor.email,
      toUserId: creditor.userId,
      toName: creditor.name,
      toEmail: creditor.email,
      amount: Math.round(amountToSettle * 100) / 100
    });

    debtor.amount -= amountToSettle;
    creditor.amount -= amountToSettle;

    if (debtor.amount <= 0.01) {
      i++;
    }
    if (creditor.amount <= 0.01) {
      j++;
    }

    // Sort again if we modified amounts and they are not fully settled yet,
    // to keep matching largest debtor to largest creditor
    if (i < debtors.length && debtor.amount > 0.01) {
      // Re-sort remainder of debtors list
      debtors.slice(i).sort((a, b) => b.amount - a.amount);
    }
    if (j < creditors.length && creditor.amount > 0.01) {
      // Re-sort remainder of creditors list
      creditors.slice(j).sort((a, b) => b.amount - a.amount);
    }
  }

  return transactions;
}

module.exports = {
  calculateGroupBalances,
  minimizeTransactions
};
