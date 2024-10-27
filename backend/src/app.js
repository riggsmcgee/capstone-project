const express = require('express');
const app = express();
const port = 3000;
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware
app.use(express.json());

// –– User routes ––

// get users ✓
app.get('/api/users', async (req, res) => {
  // res.json({ message: 'Get all users' });
  const users = await prisma.user.findMany();
  res.json(users);
});

// get user by id ✓
app.get('/api/users/:id', async (req, res) => {
  // res.json({ message: `Get user with id ${req.params.id}` });

  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// create/register user ✓
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (username.length < 3) {
      return res
        .status(400)
        .json({ error: 'Username must be at least 3 characters long' });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        roleId: 2, // Assuming 2 is the USER role ID from your seed file
      },
    });

    // Return user data without sensitive information
    res.status(201).json({
      id: user.id,
      username: user.username,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// update user (have to change username and password) ✓
app.put('/api/users/:id', async (req, res) => {
  // res.json({ message: `Update user with id ${req.params.id}` });

  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { username, password } = req.body;

  if (!username && !password) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      username,
      passwordHash: password ? await bcrypt.hash(password, 10) : undefined,
    },
  });

  res.json(updatedUser);
});

// patch user (can change username or password)  ✓
app.patch('/api/users/:id', async (req, res) => {
  // res.json({ message: `Patch user with id ${req.params.id}` });

  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { username, password } = req.body;

  if (!username && !password) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      username,
      passwordHash: password ? await bcrypt.hash(password, 10) : undefined,
    },
  });

  res.json(updatedUser);
});

// delete user ✓
app.delete('/api/users/:id', async (req, res) => {
  // res.json({ message: `Delete user with id ${req.params.id}` });

  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  res.json({ message: 'User deleted successfully' });
});

// login user ✓
app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Check if username exists
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if password is correct
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// logout (not working)
/* app.post('/api/users/logout', (req, res) => {
  // res.json({ message: 'Logout' });
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: 'Logout failed' });
    } else {
      res.json({ message: 'Logout successful' });
    }
  });
}); */

// change user role ✓
app.patch('/api/users/:id/role', async (req, res) => {
  // res.json({ message: `Change user role with id ${req.params.id}` });

  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { roleId } = req.body;

  if (!roleId) {
    return res.status(400).json({ error: 'Role ID is required' });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      roleId,
    },
  });

  res.json(updatedUser);
});

// –– Query routes ––
// Get all queries ✓
app.get('/api/queries', async (req, res) => {
  try {
    const queries = await prisma.query.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        type: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(queries);
  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
});

// Get queries by user ID
app.get('/api/queries/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const queries = await prisma.query.findMany({
      where: {
        userId: userId,
      },
      include: {
        type: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(queries);
  } catch (error) {
    console.error('Error fetching user queries:', error);
    res.status(500).json({ error: 'Failed to fetch user queries' });
  }
});

// Create a new query ✓
app.post('/api/queries', async (req, res) => {
  try {
    const { userId, content, typeId } = req.body;

    // Validate request body
    if (!userId || !content || !typeId) {
      return res.status(400).json({
        error:
          'Missing required fields: userId, content, and typeId are required',
      });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create the query
    const query = await prisma.query.create({
      data: {
        userId: parseInt(userId),
        content,
        typeId: parseInt(typeId),
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        type: {
          select: {
            name: true,
          },
        },
      },
    });

    res.status(201).json(query);
  } catch (error) {
    console.error('Error creating query:', error);
    res.status(500).json({ error: 'Failed to create query' });
  }
});

// Get query history with pagination and filters
app.get('/api/queries/history', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      userId,
      typeId,
      startDate,
      endDate,
    } = req.query;

    // Build filter conditions
    const where = {};

    if (userId) {
      where.userId = parseInt(userId);
    }

    if (typeId) {
      where.typeId = parseInt(typeId);
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get total count for pagination
    const total = await prisma.query.count({ where });

    // Get paginated queries
    const queries = await prisma.query.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
          },
        },
        type: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    res.json({
      queries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching query history:', error);
    res.status(500).json({ error: 'Failed to fetch query history' });
  }
});

// Get query analytics
app.get('/api/queries/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.lte = new Date(endDate);
      }
    }

    // Get various analytics
    const [totalQueries, queriesByType, queriesByUser, recentActivityTrend] =
      await Promise.all([
        // Total number of queries
        prisma.query.count({
          where: dateFilter,
        }),

        // Queries grouped by type
        prisma.query.groupBy({
          by: ['typeId'],
          where: dateFilter,
          _count: true,
          orderBy: {
            _count: {
              typeId: 'desc',
            },
          },
        }),

        // Top users by query count
        prisma.query.groupBy({
          by: ['userId'],
          where: dateFilter,
          _count: true,
          orderBy: {
            _count: {
              userId: 'desc',
            },
          },
          take: 5,
        }),

        // Query activity by day (last 7 days)
        prisma.query.groupBy({
          by: ['createdAt'],
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          _count: true,
          orderBy: {
            createdAt: 'asc',
          },
        }),
      ]);

    res.json({
      totalQueries,
      queriesByType,
      topUsers: queriesByUser,
      recentActivity: recentActivityTrend,
    });
  } catch (error) {
    console.error('Error fetching query analytics:', error);
    res.status(500).json({ error: 'Failed to fetch query analytics' });
  }
});

// –– Calendar routes ––
// get calendar
app.get('/api/calendar', (req, res) => {
  res.json({ message: 'Get calendar' });
});

// post calendar
app.post('/api/calendar', (req, res) => {
  res.json({ message: 'Create calendar event' });
});

// update calendar
app.put('/api/calendar/:id', (req, res) => {
  res.json({ message: `Update calendar event with id ${req.params.id}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

module.exports = app;
