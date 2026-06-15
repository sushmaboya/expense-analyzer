/**
 * CSV Parser and Validator for Expense Analyzer
 * CSV Format:
 * title,amount,currency,category,date,paid_by_email,split_type,split_details
 */

const { normalizeCurrency, isSupportedCurrency, convertToBaseCurrency } = require('./currency');

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

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, ''));
  const requiredHeaders = ['title', 'amount', 'paid_by_email', 'split_type'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return {
      validExpenses: [],
      invalidRows: [{ rowNum: 1, rawLine: lines[0], errors: [`Missing required columns: ${missingHeaders.join(', ')}`] }]
    };
  }

  const memberEmails = new Map();
  const memberByEmail = new Map();
  groupMembers.forEach(m => {
    const email = m.email.toLowerCase();
    memberEmails.set(email, m.userId);
    memberByEmail.set(email, m);
  });

  const seenExpenseKeys = new Set();
  const validExpenses = [];
  const invalidRows = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const rowValues = parseCSVLine(rawLine);
    if (rowValues.length === 0 || (rowValues.length === 1 && rowValues[0] === '')) {
      continue;
    }

    const rowNum = i + 1;
    const errors = [];
    const rowData = {};

    headers.forEach((header, index) => {
      rowData[header] = rowValues[index] || '';
    });

    const title = rowData['title'] ? rowData['title'].replace(/['"]/g, '').trim() : '';
    if (!title) {
      errors.push('Title is required.');
    }

    const amount = parseFloat(rowData['amount']);
    if (isNaN(amount) || amount <= 0) {
      errors.push('Amount must be a positive number.');
    }

    let currency = normalizeCurrency(rowData['currency'] || 'INR');
    if (!isSupportedCurrency(currency)) {
      errors.push(`Unsupported currency '${rowData['currency'] || ''}'. Allowed: INR, USD.`);
      currency = 'INR';
    }

    let category = (rowData['category'] || 'Others').replace(/['"]/g, '').trim();
    if (!category) {
      category = 'Others';
    }

    let date = null;
    if (rowData['date']) {
      const parsedDate = new Date(rowData['date'].replace(/['"]/g, '').trim());
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate;
      } else {
        errors.push('Invalid date format. Use YYYY-MM-DD.');
      }
    } else {
      errors.push('Date is required.');
    }

    const paidByEmail = (rowData['paid_by_email'] || '').toLowerCase().replace(/['"]/g, '').trim();
    let paidById = null;
    if (!paidByEmail) {
      errors.push('Paid-by email is required.');
    } else if (!memberEmails.has(paidByEmail)) {
      errors.push(`Paid-by email '${paidByEmail}' is not a member of this group.`);
    } else {
      paidById = memberEmails.get(paidByEmail);
    }

    const splitType = (rowData['split_type'] || '').toUpperCase().replace(/['"]/g, '').trim();
    if (!['EQUAL', 'EXACT', 'PERCENTAGE'].includes(splitType)) {
      errors.push('Split type must be EQUAL, EXACT, or PERCENTAGE.');
    }

    const splitDetailsRaw = (rowData['split_details'] || '').replace(/['"]/g, '').trim();
    const shares = [];

    if (errors.length === 0) {
      if (splitType === 'EQUAL') {
        let targetEmails = [];
        if (!splitDetailsRaw) {
          targetEmails = Array.from(memberEmails.keys());
        } else {
          targetEmails = splitDetailsRaw.split(';').map(e => e.trim().toLowerCase()).filter(Boolean);
        }

        const invalidEmails = targetEmails.filter(e => !memberEmails.has(e));
        if (invalidEmails.length > 0) {
          errors.push(`Split detail contains emails not in group: ${invalidEmails.join(', ')}`);
        }

        if (targetEmails.length === 0) {
          errors.push('No valid members specified to split with.');
        }

        if (errors.length === 0) {
          const splitCount = targetEmails.length;
          const shareAmount = Math.round((amount / splitCount) * 100) / 100;
          const baseTotal = convertToBaseCurrency(amount, currency);
          const baseShare = Math.round((baseTotal / splitCount) * 100) / 100;

          targetEmails.forEach((email, idx) => {
            const finalShare = idx === splitCount - 1 ? Math.round((amount - shareAmount * (splitCount - 1)) * 100) / 100 : shareAmount;
            const finalBaseShare = idx === splitCount - 1 ? Math.round((baseTotal - baseShare * (splitCount - 1)) * 100) / 100 : baseShare;
            shares.push({
              userId: memberEmails.get(email),
              email,
              amount: finalShare,
              amountInBase: finalBaseShare,
              percentage: Math.round((100 / splitCount) * 100) / 100
            });
          });
        }

      } else {
        if (!splitDetailsRaw) {
          errors.push(`Split details are required for ${splitType} split.`);
        } else {
          const parts = splitDetailsRaw.split(';').map(p => p.trim()).filter(Boolean);
          if (parts.length === 0) {
            errors.push(`Split details are required for ${splitType} split.`);
          }

          let totalSplitAmount = 0;
          let totalPercentage = 0;
          const allowedEmails = new Set(memberEmails.keys());

          for (const part of parts) {
            const [emailRaw, valueRaw] = part.split(':');
            if (!emailRaw || !valueRaw) {
              errors.push(`${splitType} split details must be in the format 'email:value;email:value'.`);
              break;
            }
            const email = emailRaw.trim().toLowerCase();
            if (!allowedEmails.has(email)) {
              errors.push(`User '${email}' in split details is not a member of this group.`);
            }

            if (splitType === 'EXACT') {
              const shareAmt = parseFloat(valueRaw.trim());
              if (isNaN(shareAmt) || shareAmt < 0) {
                errors.push(`Invalid split amount '${valueRaw}' for '${email}'.`);
              } else {
                totalSplitAmount += shareAmt;
                shares.push({
                  userId: memberEmails.get(email),
                  email,
                  amount: Math.round(shareAmt * 100) / 100,
                  amountInBase: Math.round((convertToBaseCurrency(shareAmt, currency)) * 100) / 100,
                  percentage: null
                });
              }
            } else {
              const pct = parseFloat(valueRaw.trim());
              if (isNaN(pct) || pct < 0 || pct > 100) {
                errors.push(`Invalid percentage '${valueRaw}' for '${email}'.`);
              } else {
                totalPercentage += pct;
                const shareAmt = Math.round(((pct / 100) * amount) * 100) / 100;
                shares.push({
                  userId: memberEmails.get(email),
                  email,
                  amount: shareAmt,
                  amountInBase: Math.round(((pct / 100) * convertToBaseCurrency(amount, currency)) * 100) / 100,
                  percentage: pct
                });
              }
            }
          }

          if (errors.length === 0) {
            if (splitType === 'EXACT') {
              totalSplitAmount = Math.round(totalSplitAmount * 100) / 100;
              const targetAmount = Math.round(amount * 100) / 100;
              if (Math.abs(totalSplitAmount - targetAmount) > 0.05) {
                errors.push(`Sum of exact split amounts (${totalSplitAmount}) does not match expense amount (${targetAmount}).`);
              }
            } else {
              totalPercentage = Math.round(totalPercentage * 100) / 100;
              if (Math.abs(totalPercentage - 100) > 0.01) {
                errors.push(`Sum of percentages (${totalPercentage}%) does not equal 100%.`);
              } else {
                const currentSum = shares.reduce((acc, s) => acc + s.amount, 0);
                const diff = amount - currentSum;
                if (Math.abs(diff) > 0 && shares.length > 0) {
                  shares[shares.length - 1].amount = Math.round((shares[shares.length - 1].amount + diff) * 100) / 100;
                }
                const currentBaseSum = shares.reduce((acc, s) => acc + s.amountInBase, 0);
                const baseDiff = convertToBaseCurrency(amount, currency) - currentBaseSum;
                if (Math.abs(baseDiff) > 0 && shares.length > 0) {
                  shares[shares.length - 1].amountInBase = Math.round((shares[shares.length - 1].amountInBase + baseDiff) * 100) / 100;
                }
              }
            }
          }
        }
      }
    }

    const duplicateKey = `${title}|${amount}|${currency}|${paidByEmail}|${rowData['date'] || ''}|${rowData['split_type'] || ''}|${splitDetailsRaw}`;
    if (errors.length === 0) {
      if (seenExpenseKeys.has(duplicateKey)) {
        errors.push('Duplicate expense row detected.');
      } else {
        seenExpenseKeys.add(duplicateKey);
      }
    }

    if (rowsShouldBeIgnored(rowData, errors)) {
      invalidRows.push({ rowNum, rawLine, errors });
      continue;
    }

    if (errors.length > 0) {
      invalidRows.push({ rowNum, rawLine, errors });
    } else {
      validExpenses.push({
        title,
        amount,
        currency,
        amountInBase: convertToBaseCurrency(amount, currency),
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

function rowsShouldBeIgnored(rowData, errors) {
  return errors.length > 0;
}

module.exports = {
  validateExpenseCSV
};
