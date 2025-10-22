
// src/controllers/borrow.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configurable fine rate (e.g., $1 per day overdue)
const FINE_PER_DAY = 1.0;

export const issueBook = async (req, res) => {
  const { studentId, bookId, dueDate } = req.body;

  try {
    // Validate student and book exist
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!student) return res.status(400).json({ error: 'Student not found' });
    if (!book) return res.status(400).json({ error: 'Book not found' });

    // Check availability
    if (book.availableCopies <= 0) {
      return res.status(400).json({ error: 'Book is not available for borrowing' });
    }

    // Check if student already borrowed this book and hasn't returned
    const activeBorrow = await prisma.borrowRecord.findFirst({
      where: {
        studentId,
        bookId,
        status: { in: ['BORROWED', 'OVERDUE'] },
      },
    });
    if (activeBorrow) {
      return res.status(400).json({ error: 'Student already has this book borrowed' });
    }

    // Create borrow record
    const borrow = await prisma.borrowRecord.create({
      data: { // <-- fixed
        studentId,
        bookId,
        dueDate: new Date(dueDate),
        status: 'BORROWED',
      },
    });

    // Decrement available copies
    await prisma.book.update({
      where: { id: bookId },
      data: { availableCopies: { decrement: 1 } }, // <-- fixed
    });

    res.status(201).json(borrow);
  } catch (err) {
    res.status(500).json({ error: 'Failed to issue book' });
  }
};

export const returnBook = async (req, res) => {
  const { id } = req.params;

  try {
    const borrow = await prisma.borrowRecord.findUnique({
      where: { id },
      include: { book: true },
    });
    if (!borrow) return res.status(404).json({ error: 'Borrow record not found' });

    if (borrow.status === 'RETURNED') {
      return res.status(400).json({ error: 'Book already returned' });
    }

    const returnDate = new Date();
    let fineAmount = 0;

    // Calculate fine if overdue
    if (returnDate > borrow.dueDate) {
      const diffTime = returnDate - borrow.dueDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fineAmount = diffDays * FINE_PER_DAY;
    }

    // Update borrow record
    const updated = await prisma.borrowRecord.update({
      where: { id },
      data: { // <-- fixed
        returnDate,
        fineAmount,
        finePaid: fineAmount === 0,
        status: 'RETURNED',
      },
    });

    // Increment available copies
    await prisma.book.update({
      where: { id: borrow.bookId },
      data: { availableCopies: { increment: 1 } }, // <-- fixed
    });

    // Update book status if needed (e.g., back to AVAILABLE)
    if (borrow.book.availableCopies + 1 >= borrow.book.totalCopies) {
      await prisma.book.update({
        where: { id: borrow.bookId },
        data: { status: 'AVAILABLE' }, // <-- fixed
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to return book' });
  }
};

export const getAllBorrows = async (req, res) => {
  try {
    const borrows = await prisma.borrowRecord.findMany({
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true } },
        book: { select: { title: true, author: true, isbn: true } },
      },
    });
    res.json(borrows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch borrow records' });
  }
};

export const getByStudent = async (req, res) => {
  const { studentId } = req.params;
  // Optional: restrict to self unless admin/librarian
  const user = req.user;
  if (
    user.role !== 'ADMIN' &&
    user.role !== 'LIBRARIAN' &&
    user.student?.id !== studentId
  ) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const borrows = await prisma.borrowRecord.findMany({
    where: { studentId },
    include: { book: true },
  });
  res.json(borrows);
};

export const getByBook = async (req, res) => {
  const { bookId } = req.params;
  const borrows = await prisma.borrowRecord.findMany({
    where: { bookId },
    include: { student: true },
  });
  res.json(borrows);
};
