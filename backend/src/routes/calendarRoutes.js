// Not Checked
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Authentication middleware (same as in userRoutes)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Upload/Update calendar availability
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { availability } = req.body;
    const userId = req.user.userId;

    // Validate availability data structure
    if (!availability || typeof availability !== 'object') {
      return res.status(400).json({ error: 'Invalid availability format' });
    }

    // Update or create calendar
    const calendar = await prisma.calendar.upsert({
      where: {
        userId: userId,
      },
      update: {
        availability,
      },
      create: {
        userId,
        availability,
      },
    });

    res.json(calendar);
  } catch (error) {
    console.error('Calendar update error:', error);
    res.status(500).json({ error: 'Failed to update calendar' });
  }
});

// Get user's calendar
router.get('/', authenticateToken, async (req, res) => {
  try {
    const calendar = await prisma.calendar.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!calendar) {
      return res.status(404).json({ error: 'Calendar not found' });
    }

    res.json(calendar);
  } catch (error) {
    console.error('Calendar fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch calendar' });
  }
});

// Get another user's calendar (if permissions allow)
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const calendar = await prisma.calendar.findUnique({
      where: {
        userId: parseInt(req.params.userId),
      },
    });

    if (!calendar) {
      return res.status(404).json({ error: 'Calendar not found' });
    }

    res.json(calendar);
  } catch (error) {
    console.error('Calendar fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch calendar' });
  }
});

module.exports = router;
