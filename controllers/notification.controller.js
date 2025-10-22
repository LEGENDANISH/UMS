import prisma from '../prisma/client.js';

// GET /notifications
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      userId: req.user.id,
      ...(isRead !== undefined && { isRead: isRead === 'true' }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      notifications,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// GET /notifications/:id
export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found or access denied' });
    }

    res.json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
};

// PATCH /notifications/:id — mark as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }, // <-- fixed
    });

    // Optional: ensure user owns this notification
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(notification);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Notification not found or access denied' });
    }
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

// DELETE /notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found or access denied' });
    }

    await prisma.notification.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// POST /notifications/broadcast — Admin-only
export const broadcastNotification = async (req, res) => {
  try {
    const { userIds, title, message, type, link } = req.body;

    // Validate all user IDs exist
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    });

    const existingIds = new Set(existingUsers.map(u => u.id));
    const invalidIds = userIds.filter(id => !existingIds.has(id));

    if (invalidIds.length > 0) {
      return res.status(400).json({
        error: 'Some user IDs are invalid',
        invalidIds,
      });
    }

    // Bulk create notifications
    const notifications = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        title,
        message,
        type,
        link: link || null,
        isRead: false,
      })),
      skipDuplicates: false,
    });

    res.status(201).json({ created: notifications.count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to broadcast notifications' });
  }
};
