// Not checked
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

// Submit a new query
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, typeId } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!content || !typeId) {
      return res.status(400).json({ error: 'Query content and type required' });
    }

    // Create query
    const query = await prisma.query.create({
      data: {
        userId,
        typeId,
        content,
      },
    });

    // TODO: Process query with ChatGPT API
    // This is where you'll integrate the OpenAI API to process the query
    // and return the response based on calendar availability

    res.status(201).json(query);
  } catch (error) {
    console.error('Query creation error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

// Get user's query history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const queries = await prisma.query.findMany({
      where: {
        userId: req.user.userId,
      },
      include: {
        type: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(queries);
  } catch (error) {
    console.error('Query history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch query history' });
  }
});

// Get specific query by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const query = await prisma.query.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        type: true,
      },
    });

    if (!query) {
      return res.status(404).json({ error: 'Query not found' });
    }

    // Ensure user can only access their own queries
    if (query.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(query);
  } catch (error) {
    console.error('Query fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch query' });
  }
});

module.exports = router;
