/**
 * CSV Parser and Validator for Expense Analyzer
 * CSV Format:
 * title,amount,currency,category,date,paid_by_email,split_type,split_details
 */

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Validates expense CSV rows and maps them to database structures.
 * @param {string} csvText - Raw CSV text
 * @param {Array} groupMembers - Group member objects with { user: { id, email } }
 * @returns {Object} { validExpenses: [...], invalidRows: [{ rowNum, rawLine, errors: [...] }] }
 */
function validateExpenseCSV(csvText, groupMembers) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return {
      validExpenses: [],
      invalidRows: [{ rowNum: 0, rawLine: '', errors: ['CSV is empty or missing headers.'] }]
    };
  }

  // Parse Headers
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, ''));
  const requiredHeaders = ['title', 'amount', 'paid_by_email', 'split_type'];
  
  // Check required headers
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return {
      validExpenses: [],
      invalidRows: [{ rowNum: 1, rawLine: lines[0], errors: [`Missing required columns: ${missingHeaders.join(', ')}`] }]
    };
  }

  // Create helper map of member emails to userIds
  const memberEmails = new Map();
  groupMembers.forEach(m => {
    memberEmails.set(m.user.email.toLowerCase(), m.userId);
  });

  const validExpenses = [];
  const invalidRows = [];

  // Parse rows
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const rowValues = parseCSVLine(rawLine);
    
    // Check for empty row
    if (rowValues.length === 0 || (rowValues.length === 1 && rowValues[0] === '')) {
      continue;
    }

    const rowNum = i + 1;
    const errors = [];
    const rowData = {};

    // Map columns dynamically
    headers.forEach((header, index) => {
      rowData[header] = rowValues[index] || '';
    });

    // 1. Validate Title
    const title = rowData['title'] ? rowData['title'].replace(/['"]/g, '') : '';
    if (!title) {
      errors.push("Title is required.");
    }

    // 2. Validate Amount
    const amount = parseFloat(rowData['amount']);
    if (isNaN(amount) || amount <= 0) {
      errors.push("Amount must be a positive number.");
    }

    // 3. Validate Currency
    let currency = (rowData['currency'] || 'INR').toUpperCase().replace(/['"]/g, '');
    if (currency !== 'INR' && currency !== 'USD') {
      currency = 'INR'; // Fallback with a warning or just accept it
    }

    // 4. Validate Category
    let category = (rowData['category'] || 'Others').replace(/['"]/g, '');
    if (!category) {
      category = 'Others';
    }

    // 5. Validate Date
    let date = new Date();
    if (rowData['date']) {
      const parsedDate = new Date(rowData['date'].replace(/['"]/g, ''));
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate;
      } else {
        errors.push("Invalid date format. Use YYYY-MM-DD.");
      }
    }

    // 6. Validate Paid By Email
    const paidByEmail = (rowData['paid_by_email'] || '').toLowerCase().replace(/['"]/g, '');
    let paidById = null;
    if (!paidByEmail) {
      errors.push("Paid-by email is required.");
    } else if (!memberEmails.has(paidByEmail)) {
      errors.push(`Paid-by email '${paidByEmail}' is not a member of this group.`);
    } else {
      paidById = memberEmails.get(paidByEmail);
    }

    // 7. Validate Split Type
    const splitType = (rowData['split_type'] || '').toUpperCase().replace(/['"]/g, '');
    if (!['EQUAL', 'EXACT', 'PERCENTAGE'].includes(splitType)) {
      errors.push("Split type must be EQUAL, EXACT, or PERCENTAGE.");
    }

    // 8. Validate Split Details
    const splitDetailsRaw = (rowData['split_details'] || '').replace(/['"]/g, '');
    const shares = [];

    if (errors.length === 0) {
      if (splitType === 'EQUAL') {
        // Equal split: if splitDetailsRaw is empty, split among all members
        let targetEmails = [];
        if (!splitDetailsRaw) {
          targetEmails = Array.from(memberEmails.keys());
        } else {
          targetEmails = splitDetailsRaw.split(';').map(e => e.trim().toLowerCase());
        }

        // Validate split member existence
        const invalidEmails = targetEmails.filter(e => !memberEmails.has(e));
        if (invalidEmails.length > 0) {
          errors.push(`Split detail contains emails not in group: ${invalidEmails.join(', ')}`);
        } else {
          const splitCount = targetEmails.length;
          const shareAmount = Math.round((amount / splitCount) * 100) / 100;
          
          targetEmails.forEach((email, idx) => {
            // Adjust the last share to handle division rounding
            const finalShare = idx === splitCount - 1 ? (amount - shareAmount * (splitCount - 1)) : shareAmount;
            shares.push({
              userId: memberEmails.get(email),
              email: email,
              amount: Math.round(finalShare * 100) / 100,
              percentage: Math.round((100 / splitCount) * 100) / 100
            });
          });
        }

      } else if (splitType === 'EXACT') {
        if (!splitDetailsRaw) {
          errors.push("Split details are required for EXACT split.");
        } else {
          const parts = splitDetailsRaw.split(';').map(p => p.trim());
          let totalSplitAmount = 0;
          
          for (let p of parts) {
            const [emailRaw, amtRaw] = p.split(':');
            if (!emailRaw || !amtRaw) {
              errors.push("Exact split details must be in the format 'email:amount;email:amount'.");
              break;
            }
            const email = emailRaw.trim().toLowerCase();
            const shareAmt = parseFloat(amtRaw.trim());

            if (!memberEmails.has(email)) {
              errors.push(`User '${email}' in split details is not a member of this group.`);
            }
            if (isNaN(shareAmt) || shareAmt < 0) {
              errors.push(`Invalid split amount '${amtRaw}' for '${email}'.`);
            }

            totalSplitAmount += shareAmt;
            shares.push({
              userId: memberEmails.get(email),
              email: email,
              amount: shareAmt,
              percentage: null
            });
          }

          if (errors.length === 0) {
            totalSplitAmount = Math.round(totalSplitAmount * 100) / 100;
            const targetAmount = Math.round(amount * 100) / 100;
            if (Math.abs(totalSplitAmount - targetAmount) > 0.05) {
              errors.push(`Sum of exact split amounts (${totalSplitAmount}) does not match expense amount (${targetAmount}).`);
            }
          }
        }

      } else if (splitType === 'PERCENTAGE') {
        if (!splitDetailsRaw) {
          errors.push("Split details are required for PERCENTAGE split.");
        } else {
          const parts = splitDetailsRaw.split(';').map(p => p.trim());
          let totalPercentage = 0;

          for (let p of parts) {
            const [emailRaw, pctRaw] = p.split(':');
            if (!emailRaw || !pctRaw) {
              errors.push("Percentage split details must be in the format 'email:percentage;email:percentage'.");
              break;
            }
            const email = emailRaw.trim().toLowerCase();
            const pct = parseFloat(pctRaw.trim());

            if (!memberEmails.has(email)) {
              errors.push(`User '${email}' in split details is not a member of this group.`);
            }
            if (isNaN(pct) || pct < 0 || pct > 100) {
              errors.push(`Invalid percentage '${pctRaw}' for '${email}'.`);
            }

            totalPercentage += pct;
            const shareAmt = Math.round(((pct / 100) * amount) * 100) / 100;
            shares.push({
              userId: memberEmails.get(email),
              email: email,
              amount: shareAmt,
              percentage: pct
            });
          }

          if (errors.length === 0) {
            totalPercentage = Math.round(totalPercentage * 100) / 100;
            if (Math.abs(totalPercentage - 100) > 0.01) {
              errors.push(`Sum of percentages (${totalPercentage}%) does not equal 100%.`);
            } else {
              // Adjust the last share to ensure exact sum matches amount
              let currentSharesSum = shares.reduce((acc, s) => acc + s.amount, 0);
              const diff = amount - currentSharesSum;
              if (Math.abs(diff) > 0 && shares.length > 0) {
                shares[shares.length - 1].amount = Math.round((shares[shares.length - 1].amount + diff) * 100) / 100;
              }
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      invalidRows.push({
        rowNum,
        rawLine,
        errors
      });
    } else {
      validExpenses.push({
        title,
        amount,
        currency,
        category,
        date,
        paidById,
        splitType,
        shares
      });
    }
  }

  return {
    validExpenses,
    invalidRows
  };
}

module.exports = {
  validateExpenseCSV
};
