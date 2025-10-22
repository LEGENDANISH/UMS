import prisma from '../prisma/client.js';

// GET /club-budgets
export const getClubBudgets = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, clubId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (type) where.type = type;
    if (clubId) where.clubId = clubId;

    const [budgets, total] = await Promise.all([
      prisma.clubBudget.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { transactionDate: 'desc' },
        include: { club: { select: { id: true, name: true } } },
      }),
      prisma.clubBudget.count({ where }),
    ]);

    res.json({
      data: budgets,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch club budgets' });
  }
};

// POST /club-budgets
export const createClubBudget = async (req, res) => {
  try {
    const { clubId, title, description, amount, type, category } = req.body;

    // Validate club exists
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      return res.status(400).json({ error: 'Invalid clubId: club not found' });
    }

    const budget = await prisma.clubBudget.create({
      data: { // <-- fixed
        clubId,
        title,
        description: description || null,
        amount,
        type,
        category: category || null,
        transactionDate: new Date(), // optional: override via req.body if needed
      },
    });

    res.status(201).json(budget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create club budget' });
  }
};

// GET /club-budgets/by-club/:clubId
export const getClubBudgetsByClub = async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const budgets = await prisma.clubBudget.findMany({
      where: { clubId },
      orderBy: { transactionDate: 'desc' },
    });

    res.json(budgets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch budgets for club' });
  }
};
