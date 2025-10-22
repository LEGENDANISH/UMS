// src/controllers/fee.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Utility: check if requester can access student data
const canAccessStudent = (req, studentId) => {
  const user = req.user;
  return (
    user.role === 'ADMIN' ||
    user.role === 'MANAGEMENT' ||
    (user.role === 'STUDENT' && user.student?.id === studentId)
  );
};

export const getAllFeeRecords = async (req, res) => {
  try {
    const records = await prisma.feeRecord.findMany({
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true } },
        transactions: true,
      },
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fee records' });
  }
};

export const createFeeRecord = async (req, res) => {
  const { studentId, semester, year, totalAmount, dueDate } = req.body;

  try {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return res.status(400).json({ error: 'Student not found' });

    const record = await prisma.feeRecord.create({
      data: { // <-- fixed
        studentId,
        semester,
        year,
        totalAmount,
        amountPaid: 0,
        dueDate: new Date(dueDate),
        status: 'PENDING',
      },
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create fee record' });
  }
};

export const getFeeRecordById = async (req, res) => {
  const { id } = req.params;
  try {
    const record = await prisma.feeRecord.findUnique({
      where: { id },
      include: {
        student: { select: { firstName: true, lastName: true } },
        transactions: true,
      },
    });
    if (!record) return res.status(404).json({ error: 'Fee record not found' });

    if (!canAccessStudent(req, record.studentId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fee record' });
  }
};

export const updateFeeRecord = async (req, res) => {
  const { id } = req.params;
  const { totalAmount, dueDate, status } = req.body;

  try {
    const updated = await prisma.feeRecord.update({
      where: { id },
      data: { // <-- fixed
        totalAmount,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
      },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Fee record not found' });
    res.status(500).json({ error: 'Failed to update fee record' });
  }
};

export const getFeeRecordsByStudent = async (req, res) => {
  const { studentId } = req.params;
  if (!canAccessStudent(req, studentId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const records = await prisma.feeRecord.findMany({
    where: { studentId },
    include: { transactions: true },
  });
  res.json(records);
};

export const createFeeTransaction = async (req, res) => {
  const { feeRecordId, amount, paymentMethod, transactionId, receiptNumber, remarks } = req.body;

  try {
    const feeRecord = await prisma.feeRecord.findUnique({ where: { id: feeRecordId } });
    if (!feeRecord) return res.status(400).json({ error: 'Fee record not found' });

    // Ensure amount doesn't exceed balance
    const balance = feeRecord.totalAmount - feeRecord.amountPaid;
    if (amount > balance) {
      return res.status(400).json({ error: 'Payment amount exceeds outstanding balance' });
    }

    const transaction = await prisma.feeTransaction.create({
      data: { // <-- fixed
        feeRecordId,
        amount,
        paymentMethod,
        transactionId: transactionId || null,
        receiptNumber,
        remarks: remarks || null,
      },
    });

    // Update amountPaid and status
    const newAmountPaid = feeRecord.amountPaid + amount;
    let newStatus = feeRecord.status;
    if (newAmountPaid >= feeRecord.totalAmount) {
      newStatus = 'PAID';
    } else if (newAmountPaid > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    await prisma.feeRecord.update({
      where: { id: feeRecordId },
      data: { amountPaid: newAmountPaid, status: newStatus }, // <-- fixed
    });

    res.status(201).json(transaction);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Receipt number or transaction ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create fee transaction' });
  }
};

export const getTransactionsByRecord = async (req, res) => {
  const { feeRecordId } = req.params;
  const transactions = await prisma.feeTransaction.findMany({
    where: { feeRecordId },
  });
  res.json(transactions);
};
