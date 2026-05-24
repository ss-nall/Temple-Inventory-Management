import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import { getNextKalyanamDate } from "../utils/date.js";
import { getOrCreateInventory } from "../utils/inventory.js";

const safeNumber = (value) => Math.max(0, Number(value) || 0);
const signedNumber = (value) => Number(value) || 0;

const applyTransaction = (totals, tx) => {
  const type = tx.type;
  const sarees = type === "ADJUSTMENT" ? signedNumber(tx.sarees) : safeNumber(tx.sarees);
  const panchas = type === "ADJUSTMENT" ? signedNumber(tx.panchas) : safeNumber(tx.panchas);

  if (type === "ADD") {
    totals.sarees += sarees;
    totals.panchas += panchas;
  } else if (type === "DISTRIBUTE") {
    totals.sarees -= sarees;
    totals.panchas -= panchas;
  } else if (type === "ADJUSTMENT") {
    totals.sarees += sarees;
    totals.panchas += panchas;
  }
};

const computeInventoryFromTransactions = (transactions) => {
  const totals = { sarees: 0, panchas: 0 };
  for (const tx of transactions) {
    applyTransaction(totals, tx);
  }
  if (totals.sarees < 0 || totals.panchas < 0) {
    throw new Error("Edited history would result in negative inventory. Please adjust the log values.");
  }
  return totals;
};

const saveInventoryTotals = async (totals) => {
  const inventory = await getOrCreateInventory();
  inventory.sarees = totals.sarees;
  inventory.panchas = totals.panchas;
  inventory.updatedAt = new Date();
  await inventory.save();
  return inventory;
};

const getAllTransactionsChronological = async () =>
  Transaction.find().sort({ date: 1, _id: 1 }).lean();

const recalculateInventoryFromHistory = async () => {
  const allTx = await getAllTransactionsChronological();
  const totals = computeInventoryFromTransactions(allTx);
  return saveInventoryTotals(totals);
};

export const getInventory = async (_req, res) => {
  const inventory = await getOrCreateInventory();
  return res.json(inventory);
};

export const getDashboardMetrics = async (_req, res) => {
  const inventory = await getOrCreateInventory();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const threshold = Number(process.env.LOW_STOCK_THRESHOLD || 10);

  const monthTx = await Transaction.find({
    date: { $gte: monthStart, $lte: now }
  });

  const totals = monthTx.reduce(
    (acc, tx) => {
      if (tx.type === "ADD") {
        acc.addedSarees += tx.sarees;
        acc.addedPanchas += tx.panchas;
      }
      if (tx.type === "DISTRIBUTE") {
        acc.distributedSarees += tx.sarees;
        acc.distributedPanchas += tx.panchas;
      }
      return acc;
    },
    {
      addedSarees: 0,
      addedPanchas: 0,
      distributedSarees: 0,
      distributedPanchas: 0
    }
  );

  return res.json({
    currentSarees: inventory.sarees,
    currentPanchas: inventory.panchas,
    distributedThisMonth: totals.distributedSarees + totals.distributedPanchas,
    addedThisMonth: totals.addedSarees + totals.addedPanchas,
    remainingInventory: inventory.sarees + inventory.panchas,
    upcomingKalyanamDate: getNextKalyanamDate(),
    lowStockAlerts: {
      threshold,
      sareesLow: inventory.sarees <= threshold,
      panchasLow: inventory.panchas <= threshold
    }
  });
};

export const addStock = async (req, res) => {
  const sarees = safeNumber(req.body.sarees);
  const panchas = safeNumber(req.body.panchas);
  const { donorName = "", notes = "", date } = req.body;

  if (sarees === 0 && panchas === 0) {
    return res.status(400).json({ message: "Provide sarees or panchas quantity greater than 0." });
  }

  const inventory = await getOrCreateInventory();
  inventory.sarees += sarees;
  inventory.panchas += panchas;
  inventory.updatedAt = new Date();
  await inventory.save();

  const transaction = await Transaction.create({
    type: "ADD",
    sarees,
    panchas,
    donorName,
    notes,
    date: date ? new Date(date) : new Date(),
    createdBy: req.user?._id
  });

  return res.status(201).json({
    message: "Stock added successfully.",
    inventory,
    transaction
  });
};

export const distributeStock = async (req, res) => {
  const sarees = safeNumber(req.body.sarees);
  const panchas = safeNumber(req.body.panchas);
  const { sponsorName = "", notes = "", eventDate, date } = req.body;

  if (sarees === 0 && panchas === 0) {
    return res.status(400).json({ message: "Provide sarees or panchas quantity greater than 0." });
  }

  const inventory = await getOrCreateInventory();

  if (inventory.sarees < sarees || inventory.panchas < panchas) {
    return res.status(400).json({
      message: "Insufficient stock for distribution.",
      currentStock: {
        sarees: inventory.sarees,
        panchas: inventory.panchas
      }
    });
  }

  inventory.sarees -= sarees;
  inventory.panchas -= panchas;
  inventory.updatedAt = new Date();
  await inventory.save();

  const transaction = await Transaction.create({
    type: "DISTRIBUTE",
    sarees,
    panchas,
    sponsorName,
    notes,
    eventDate: eventDate ? new Date(eventDate) : undefined,
    date: date ? new Date(date) : new Date(),
    createdBy: req.user?._id
  });

  return res.status(201).json({
    message: "Stock distributed successfully.",
    inventory,
    transaction
  });
};

export const getInventoryHistory = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find()
      .sort({ date: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "username role"),
    Transaction.countDocuments()
  ]);

  return res.json({
    items: transactions,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  });
};

export const resetStock = async (req, res) => {
  const targetSarees = safeNumber(req.body.sarees);
  const targetPanchas = safeNumber(req.body.panchas);
  const reason = String(req.body.reason || "").trim();
  const date = req.body.date ? new Date(req.body.date) : new Date();

  if (!reason) {
    return res.status(400).json({ message: "Reason is required for stock reset." });
  }

  const inventory = await getOrCreateInventory();
  const sareeDelta = targetSarees - inventory.sarees;
  const panchaDelta = targetPanchas - inventory.panchas;

  inventory.sarees = targetSarees;
  inventory.panchas = targetPanchas;
  inventory.updatedAt = new Date();
  await inventory.save();

  const transaction = await Transaction.create({
    type: "ADJUSTMENT",
    sarees: signedNumber(sareeDelta),
    panchas: signedNumber(panchaDelta),
    notes: `RESET | ${reason}`,
    date,
    createdBy: req.user?._id
  });

  return res.status(201).json({
    message: "Stock reset applied successfully.",
    inventory,
    transaction
  });
};

export const clearStock = async (req, res) => {
  const reason = String(req.body.reason || "").trim() || "Manual clear";
  const date = req.body.date ? new Date(req.body.date) : new Date();

  const inventory = await getOrCreateInventory();
  const sareeDelta = -inventory.sarees;
  const panchaDelta = -inventory.panchas;

  inventory.sarees = 0;
  inventory.panchas = 0;
  inventory.updatedAt = new Date();
  await inventory.save();

  const transaction = await Transaction.create({
    type: "ADJUSTMENT",
    sarees: signedNumber(sareeDelta),
    panchas: signedNumber(panchaDelta),
    notes: `CLEAR | ${reason}`,
    date,
    createdBy: req.user?._id
  });

  return res.status(201).json({
    message: "Inventory cleared to zero.",
    inventory,
    transaction
  });
};

const buildEditedTx = (existingTx, body) => {
  const parseDateValue = (value, fieldName) => {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid ${fieldName}.`);
    }
    return parsed;
  };

  const nextType = body.type || existingTx.type;
  if (!["ADD", "DISTRIBUTE", "ADJUSTMENT"].includes(nextType)) {
    throw new Error("Invalid transaction type.");
  }

  const sarees = nextType === "ADJUSTMENT" ? signedNumber(body.sarees ?? existingTx.sarees) : safeNumber(body.sarees ?? existingTx.sarees);
  const panchas = nextType === "ADJUSTMENT" ? signedNumber(body.panchas ?? existingTx.panchas) : safeNumber(body.panchas ?? existingTx.panchas);

  const parsedDate = parseDateValue(body.date, "date");
  const parsedEventDate = parseDateValue(body.eventDate, "event date");

  return {
    _id: existingTx._id,
    type: nextType,
    sarees,
    panchas,
    sponsorName: String(body.sponsorName ?? existingTx.sponsorName ?? ""),
    donorName: String(body.donorName ?? existingTx.donorName ?? ""),
    notes: String(body.notes ?? existingTx.notes ?? ""),
    date: parsedDate === null ? existingTx.date : parsedDate || existingTx.date,
    eventDate:
      parsedEventDate === null
        ? undefined
        : parsedEventDate || existingTx.eventDate || undefined
  };
};

export const editHistoryLog = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid transaction ID." });
  }

  const existingTx = await Transaction.findById(id);
  if (!existingTx) {
    return res.status(404).json({ message: "Transaction not found." });
  }

  let editedTx;
  try {
    editedTx = buildEditedTx(existingTx, req.body);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  const allTx = await getAllTransactionsChronological();
  const projected = allTx.map((tx) => (String(tx._id) === id ? { ...tx, ...editedTx } : tx));

  let totals;
  try {
    totals = computeInventoryFromTransactions(projected);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  existingTx.type = editedTx.type;
  existingTx.sarees = editedTx.sarees;
  existingTx.panchas = editedTx.panchas;
  existingTx.sponsorName = editedTx.sponsorName;
  existingTx.donorName = editedTx.donorName;
  existingTx.notes = editedTx.notes;
  existingTx.date = editedTx.date;
  existingTx.eventDate = editedTx.eventDate;
  await existingTx.save();

  const inventory = await saveInventoryTotals(totals);

  return res.json({
    message: "Transaction updated successfully.",
    transaction: existingTx,
    inventory
  });
};

export const deleteHistoryLog = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid transaction ID." });
  }

  const existingTx = await Transaction.findById(id);
  if (!existingTx) {
    return res.status(404).json({ message: "Transaction not found." });
  }

  const allTx = await getAllTransactionsChronological();
  const projected = allTx.filter((tx) => String(tx._id) !== id);

  let totals;
  try {
    totals = computeInventoryFromTransactions(projected);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  await Transaction.findByIdAndDelete(id);
  const inventory = await saveInventoryTotals(totals);

  return res.json({
    message: "Transaction deleted successfully.",
    inventory
  });
};

export const clearAllHistory = async (req, res) => {
  const confirmation = String(req.body.confirm || "");
  if (confirmation !== "CLEAR_HISTORY") {
    return res.status(400).json({
      message: "Confirmation required. Send { confirm: \"CLEAR_HISTORY\" }."
    });
  }

  await Transaction.deleteMany({});
  const inventory = await recalculateInventoryFromHistory();

  return res.json({
    message: "All transaction history cleared successfully.",
    inventory
  });
};
