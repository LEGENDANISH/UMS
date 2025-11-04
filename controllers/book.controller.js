// src/controllers/book.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllBooks = async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: { title: 'asc' },
    });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

export const createBook = async (req, res) => {
  const {
    title,
    author,
    isbn,
    publisher,
    publishedYear,
    category,
    description,
    totalCopies,
    shelfLocation,
    coverImage,
  } = req.body;

  try {
    if (totalCopies <= 0) {
      return res.status(400).json({ error: 'Total copies must be at least 1' });
    }

    const book = await prisma.book.create({
      data: { // <-- fixed
        title,
        author,
        isbn,
        publisher: publisher || null,
        publishedYear: publishedYear || null,
        category,
        description: description || null,
        totalCopies,
        availableCopies: totalCopies, // initially all available
        status: 'AVAILABLE',
        shelfLocation: shelfLocation || null,
        coverImage: coverImage || null,
      },
    });
    res.status(201).json(book);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'ISBN already exists' });
    }
    res.status(500).json({ error: 'Failed to create book' });
  }
};

export const getBookById = async (req, res) => {
  const { id } = req.params;
  try {
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch book' });
  }
};

export const updateBook = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    author,
    isbn,
    publisher,
    publishedYear,
    category,
    description,
    totalCopies,
    availableCopies,
    status,
    shelfLocation,
    coverImage,
  } = req.body;

  try {
    const current = await prisma.book.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: 'Book not found' });

    // Prevent availableCopies > totalCopies
    if (totalCopies !== undefined && availableCopies !== undefined) {
      if (availableCopies > totalCopies) {
        return res.status(400).json({ error: 'Available copies cannot exceed total copies' });
      }
    } else if (totalCopies !== undefined) {
      if (current.availableCopies > totalCopies) {
        return res.status(400).json({ error: 'New total copies less than available copies' });
      }
    } else if (availableCopies !== undefined) {
      if (availableCopies > current.totalCopies) {
        return res.status(400).json({ error: 'Available copies cannot exceed total copies' });
      }
    }

    const updated = await prisma.book.update({
      where: { id },
      data: { // <-- fixed
        title,
        author,
        isbn,
        publisher: publisher || null,
        publishedYear: publishedYear || null,
        category,
        description: description || null,
        totalCopies,
        availableCopies,
        status,
        shelfLocation: shelfLocation || null,
        coverImage: coverImage || null,
      },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'ISBN already in use' });
    }
    res.status(500).json({ error: 'Failed to update book' });
  }
};

export const deleteBook = async (req, res) => {
  const { id } = req.params;
  try {
    // Optional: prevent deletion if borrowed
    const activeBorrows = await prisma.borrowRecord.count({
      where: { bookId: id, status: { not: 'RETURNED' } },
    });
    if (activeBorrows > 0) {
      return res.status(400).json({ error: 'Cannot delete book with active borrow records' });
    }

    await prisma.book.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.status(500).json({ error: 'Failed to delete book' });
  }
};

export const searchBooks = async (req, res) => {
  const { title, author, category } = req.query;

  const where = {};
  if (title) where.title = { contains: title, mode: 'insensitive' };
  if (author) where.author = { contains: author, mode: 'insensitive' };
  if (category) where.category = { contains: category, mode: 'insensitive' };

  try {
    const books = await prisma.book.findMany({
      where,
      orderBy: { title: 'asc' },
    });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
};
