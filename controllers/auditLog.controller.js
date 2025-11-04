// src/controllers/auditLog.controller.js
import prisma from '../prisma/client.js';

// Utility: parse page & limit
const parsePagination = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 50;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /audit-logs
export const getAllAuditLogs = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, role: true } } },
      }),
      prisma.auditLog.count(),
    ]);

    res.json({
      data: logs,
      meta: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

// GET /audit-logs/user/:userId
export const getByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, limit, skip } = parsePagination(req.query);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, role: true } } },
      }),
      prisma.auditLog.count({ where: { userId } }),
    ]);

    res.json({
      data: logs,
      meta: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit logs for user' });
  }
};

// GET /audit-logs/action/:action
export const getByAction = async (req, res) => {
  try {
    const { action } = req.params;
    const { page, limit, skip } = parsePagination(req.query);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { action },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, role: true } } },
      }),
      prisma.auditLog.count({ where: { action } }),
    ]);

    res.json({
      data: logs,
      meta: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit logs for action' });
  }
};
