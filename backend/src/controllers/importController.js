const prisma = require('../utils/db');
const { validateExpenseCSV } = require('../utils/csvValidator');

// Import expenses from CSV for a group
async function importExpensesCSV(req, res) {
  try {
    const groupId = parseInt(req.params.id);
    const userId = req.user.id; // Logged-in user initiating import
    const { fileName, csvContent } = req.body;

    if (isNaN(groupId)) {
      return res.status(400).json({ error: 'Invalid group ID.' });
    }

    if (!fileName || !csvContent) {
      return res.status(400).json({ error: 'File name and CSV content are required.' });
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    // Perform CSV parsing and validation using membership history
    const groupMembersWithDates = group.members.map(m => ({
      userId: m.userId,
      email: m.user.email.toLowerCase(),
      joinedAt: m.joinedAt,
      leftAt: m.leftAt
    }));

    const { validExpenses, invalidRows } = validateExpenseCSV(csvContent, groupMembersWithDates);

    const totalRows = validExpenses.length + invalidRows.length;
    let importedRows = 0;
    let failedRows = invalidRows.length;

    const dbImportedExpenses = [];

    // Save valid expenses inside a database transaction
    if (validExpenses.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const exp of validExpenses) {
          const createdExp = await tx.expense.create({
            data: {
              title: exp.title,
              amount: exp.amount,
              currency: exp.currency,
              amountInBase: exp.amountInBase,
              category: exp.category,
              date: exp.date,
              paidById: exp.paidById,
              groupId: groupId,
              splitType: exp.splitType
            }
          });

          // Create shares
          await Promise.all(
            exp.shares.map(s =>
              tx.expenseShare.create({
                data: {
                  expenseId: createdExp.id,
                  userId: s.userId,
                  amount: s.amount,
                  amountInBase: s.amountInBase,
                  percentage: s.percentage
                }
              })
            )
          );

          dbImportedExpenses.push(createdExp);
          importedRows++;
        }
      });
    }

    // Calculate overall status
    let status = 'SUCCESS';
    if (importedRows === 0 && failedRows > 0) {
      status = 'FAILED';
    } else if (failedRows > 0) {
      status = 'PARTIAL';
    }

    // Create error log summary
    let errorLogString = null;
    if (invalidRows.length > 0) {
      errorLogString = invalidRows.map(row => 
        `Row ${row.rowNum}: [${row.rawLine}] - Errors: ${row.errors.join(', ')}`
      ).join('\n');
    }

    // Create Import Report in database
    const report = await prisma.importReport.create({
      data: {
        userId,
        fileName,
        status,
        totalRows,
        importedRows,
        failedRows,
        errorLog: errorLogString
      }
    });

    return res.status(200).json({
      message: `Import complete. Status: ${status}`,
      report,
      importedCount: importedRows,
      failedCount: failedRows,
      invalidRows // Send detail of failed rows back for live dashboard feedback
    });
  } catch (err) {
    console.error('Import CSV Error:', err);
    return res.status(500).json({ error: 'An error occurred while importing CSV data.' });
  }
}

// Fetch all import reports for user
async function listImportReports(req, res) {
  try {
    const userId = req.user.id;
    const reports = await prisma.importReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(reports);
  } catch (err) {
    console.error('List Import Reports Error:', err);
    return res.status(500).json({ error: 'An error occurred while fetching import reports.' });
  }
}

module.exports = {
  importExpensesCSV,
  listImportReports
};
