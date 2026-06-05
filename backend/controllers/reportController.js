import Transaction from "../models/Transaction.js";
import { getMonthRange } from "../utils/date.js";

const parseMonthYear = (monthParam, yearParam) => {
  const now = new Date();
  const month = Number(monthParam) || now.getMonth() + 1;
  const year = Number(yearParam) || now.getFullYear();

  if (month < 1 || month > 12 || year < 2000 || year > 3000) {
    return null;
  }
  return { month, year };
};

const sumTransactions = (transactions) =>
  transactions.reduce(
    (acc, tx) => {
      if (tx.status === "PENDING") {
        return acc;
      }
      if (tx.type === "ADD") {
        acc.addedSarees += tx.sarees;
        acc.addedPanchas += tx.panchas;
      } else if (tx.type === "DISTRIBUTE") {
        acc.distributedSarees += tx.sarees;
        acc.distributedPanchas += tx.panchas;
      } else if (tx.type === "ADJUSTMENT") {
        acc.adjustmentSarees += tx.sarees;
        acc.adjustmentPanchas += tx.panchas;
      }
      return acc;
    },
    {
      addedSarees: 0,
      addedPanchas: 0,
      distributedSarees: 0,
      distributedPanchas: 0,
      adjustmentSarees: 0,
      adjustmentPanchas: 0
    }
  );

export const getMonthlyReport = async (req, res) => {
  const parsed = parseMonthYear(req.query.month, req.query.year);
  if (!parsed) {
    return res.status(400).json({ message: "Invalid month/year." });
  }

  const { month, year } = parsed;
  const { start, end } = getMonthRange(month, year);

  const [beforeTx, monthTx] = await Promise.all([
    Transaction.find({ date: { $lt: start } }).sort({ date: 1 }),
    Transaction.find({ date: { $gte: start, $lte: end } })
      .sort({ date: 1 })
      .populate("createdBy", "username")
  ]);

  const beforeTotals = sumTransactions(beforeTx);
  const monthTotals = sumTransactions(monthTx);

  const opening = {
    sarees: beforeTotals.addedSarees - beforeTotals.distributedSarees + beforeTotals.adjustmentSarees,
    panchas: beforeTotals.addedPanchas - beforeTotals.distributedPanchas + beforeTotals.adjustmentPanchas
  };

  const closing = {
    sarees:
      opening.sarees + monthTotals.addedSarees - monthTotals.distributedSarees + monthTotals.adjustmentSarees,
    panchas:
      opening.panchas + monthTotals.addedPanchas - monthTotals.distributedPanchas + monthTotals.adjustmentPanchas
  };

  const kalyanamSummary = monthTx.filter((tx) => tx.type === "DISTRIBUTE");

  return res.json({
    month,
    year,
    dateRange: { start, end },
    openingStock: opening,
    stockAdded: {
      sarees: monthTotals.addedSarees,
      panchas: monthTotals.addedPanchas
    },
    stockDistributed: {
      sarees: monthTotals.distributedSarees,
      panchas: monthTotals.distributedPanchas
    },
    stockAdjustments: {
      sarees: monthTotals.adjustmentSarees,
      panchas: monthTotals.adjustmentPanchas
    },
    closingStock: closing,
    transactionHistory: monthTx,
    kalyanamSummary
  });
};

export const getMonthlyTrends = async (_req, res) => {
  const now = new Date();
  const months = [];

  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }

  const data = await Promise.all(
    months.map(async ({ month, year }) => {
      const { start, end } = getMonthRange(month, year);
      const tx = await Transaction.find({ date: { $gte: start, $lte: end } });
      const totals = sumTransactions(tx);
      return {
        key: `${year}-${String(month).padStart(2, "0")}`,
        month,
        year,
        addedSarees: totals.addedSarees,
        addedPanchas: totals.addedPanchas,
        distributedSarees: totals.distributedSarees,
        distributedPanchas: totals.distributedPanchas
      };
    })
  );

  return res.json(data);
};
