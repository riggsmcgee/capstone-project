const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const aiService = require('./services/aiService');

const { authenticateToken, generateToken } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = 3000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://calendar-service-8q9b.onrender.com',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg =
        'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/calendar', authenticateToken);
app.use('/api/queries', authenticateToken);

// –– User routes ––

// get users ✓
app.get('/api/users', async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      role: true,
    },
  });
  res.json(users);
});

// get user by id ✓
app.get('/api/users/:id', async (req, res) => {
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

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        roleId: 2,
      },
    });

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

app.patch('/api/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const { username, password, roleId } = req.body;

  if (!username && !password && !roleId) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  const dataToUpdate = {};
  if (username) dataToUpdate.username = username;
  if (password) dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
  if (roleId) dataToUpdate.roleId = roleId;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      include: { role: true },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// delete user ✓
app.delete('/api/users/:id', async (req, res) => {
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

  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.queryUser.deleteMany({
        where: { userId: userId },
      });

      await prisma.friendship.deleteMany({
        where: {
          OR: [{ requesterId: userId }, { receiverId: userId }],
        },
      });

      const userQueries = await prisma.query.findMany({
        where: { userId: userId },
        select: { id: true },
      });

      const queryIds = userQueries.map((query) => query.id);

      await prisma.queryUser.deleteMany({
        where: { queryId: { in: queryIds } },
      });

      await prisma.query.deleteMany({
        where: { userId: userId },
      });

      await prisma.calendar.deleteMany({
        where: { userId: userId },
      });

      await prisma.user.delete({
        where: { id: userId },
      });
    });

    res.json({ message: 'User and all related records deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// login user
app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.roleId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// change user role ✓
app.patch('/api/users/:id/role', async (req, res) => {
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

app.get('/api/queries/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

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
    const requesterId = req.user.id;

    if (!userId || !content || !typeId) {
      return res.status(400).json({
        error:
          'Missing required fields: userId, content, and typeId are required',
      });
    }

    if (!Array.isArray(userId) || userId.length === 0) {
      return res.status(400).json({ error: 'Please select at least one user' });
    }

    const userIdInts = userId.map((id) => parseInt(id, 10));

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIdInts,
        },
      },
    });

    if (users.length !== userIdInts.length) {
      return res
        .status(404)
        .json({ error: 'One or more target users not found' });
    }

    const calendars = await prisma.calendar.findMany({
      where: { userId: { in: userIdInts } },
      include: { user: { select: { username: true } } },
    });

    if (calendars.length !== userIdInts.length) {
      return res
        .status(404)
        .json({ error: 'Calendar not found for one or more users' });
    }

    const requesterCalendar = await prisma.calendar.findUnique({
      where: { userId: requesterId },
      select: {
        user: {
          select: {
            username: true,
          },
        },
        availability: true,
      },
    });

    if (!requesterCalendar) {
      return res.status(404).json({ error: 'Requester calendar not found' });
    }

    const allCalendars = [requesterCalendar, ...calendars];

    let aiResult = await aiService.processAvailabilityQuery(
      content,
      allCalendars
    );

    const aiResultString =
      typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult);

    const query = await prisma.query.create({
      data: {
        userId: requesterId,
        content,
        typeId: parseInt(typeId, 10),
        result: aiResultString,
        targetUsers: {
          create: userIdInts.map((id) => ({ userId: id })),
        },
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

    res.status(201).json({ query, aiResult: aiResultString });
  } catch (error) {
    console.error('Error creating query:', error);
    res
      .status(500)
      .json({ error: 'Failed to create query', details: error.message });
  }
});

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

    const total = await prisma.query.count({ where });

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

    const [totalQueries, queriesByType, queriesByUser, recentActivityTrend] =
      await Promise.all([
        prisma.query.count({
          where: dateFilter,
        }),

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

// Calendar Routes
// Get all calendars ✓
app.get('/api/calendar', async (req, res) => {
  try {
    const calendars = await prisma.calendar.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
    res.json(calendars);
  } catch (error) {
    console.error('Error fetching calendars:', error);
    res.status(500).json({ error: 'Failed to fetch calendars' });
  }
});

// Get calendar by user ID ✓
app.get('/api/calendar/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const calendar = await prisma.calendar.findFirst({
      where: {
        userId: userId,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!calendar) {
      return res
        .status(404)
        .json({ error: 'Calendar not found for this user' });
    }

    res.json(calendar);
  } catch (error) {
    console.error('Error fetching user calendar:', error);
    res.status(500).json({ error: 'Failed to fetch user calendar' });
  }
});

app.get('/api/calendar/users', async (req, res) => {
  try {
    const userIds = req.query.userIds;

    if (!userIds) {
      return res.status(400).json({ error: 'User IDs are required' });
    }

    const userIdArray = userIds.split(',').map((id) => parseInt(id));

    if (userIdArray.some(isNaN)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const calendars = await prisma.calendar.findMany({
      where: {
        userId: {
          in: userIdArray,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.json(calendars);
  } catch (error) {
    console.error('Error fetching multiple user calendars:', error);
    res.status(500).json({ error: 'Failed to fetch user calendars' });
  }
});

// Create calendar
app.post('/api/calendar', async (req, res) => {
  try {
    const { userId, calendarInput } = req.body;

    if (!userId || !calendarInput) {
      return res.status(400).json({
        error: 'Missing required fields: userId and calendarInput are required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingCalendar = await prisma.calendar.findFirst({
      where: { userId: parseInt(userId) },
    });

    if (existingCalendar) {
      return res.status(400).json({ error: 'User already has a calendar' });
    }

    const processedAvailability = await aiService.processCalendarInput(
      calendarInput
    );

    const calendar = await prisma.calendar.create({
      data: {
        userId: parseInt(userId),
        availability: processedAvailability,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    res.status(201).json(calendar);
  } catch (error) {
    console.error('Error creating calendar:', error);
    res.status(500).json({ error: 'Failed to create calendar' });
  }
});

// Update entire calendar
app.put('/api/calendar/:id', async (req, res) => {
  try {
    const calendarId = parseInt(req.params.id);
    const { availability } = req.body;

    if (isNaN(calendarId)) {
      return res.status(400).json({ error: 'Invalid calendar ID' });
    }

    if (!availability) {
      return res.status(400).json({ error: 'Availability is required' });
    }

    const existingCalendar = await prisma.calendar.findUnique({
      where: { id: calendarId },
    });

    if (!existingCalendar) {
      return res.status(404).json({ error: 'Calendar not found' });
    }

    const updatedCalendar = await prisma.calendar.update({
      where: { id: calendarId },
      data: {
        availability,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    res.json(updatedCalendar);
  } catch (error) {
    console.error('Error updating calendar:', error);
    res.status(500).json({ error: 'Failed to update calendar' });
  }
});

// Delete calendar ✓
app.delete('/api/calendar/:id', async (req, res) => {
  try {
    const calendarId = parseInt(req.params.id);

    if (isNaN(calendarId)) {
      return res.status(400).json({ error: 'Invalid calendar ID' });
    }

    const existingCalendar = await prisma.calendar.findUnique({
      where: { id: calendarId },
    });

    if (!existingCalendar) {
      return res.status(404).json({ error: 'Calendar not found' });
    }

    await prisma.calendar.delete({
      where: { id: calendarId },
    });

    res.json({ message: 'Calendar deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar:', error);
    res.status(500).json({ error: 'Failed to delete calendar' });
  }
});

// –– Friendship routes ––

// Send a Friend Request
app.post('/api/friends/request', authenticateToken, async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { receiverId } = req.body;

    if (requesterId === receiverId) {
      return res
        .status(400)
        .json({ error: 'Cannot send friend request to yourself.' });
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found.' });
    }

    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId },
        ],
      },
    });

    if (existingFriendship) {
      return res
        .status(400)
        .json({ error: 'Friendship already exists or pending.' });
    }

    const friendship = await prisma.friendship.create({
      data: {
        requesterId,
        receiverId,
        status: 'PENDING',
      },
    });

    res.status(201).json({ message: 'Friend request sent.', friendship });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request.' });
  }
});

// Accept a Friend Request
app.post('/api/friends/accept', authenticateToken, async (req, res) => {
  try {
    const receiverId = req.user.id;
    const { requesterId } = req.body;

    const friendship = await prisma.friendship.findFirst({
      where: {
        requesterId,
        receiverId,
        status: 'PENDING',
      },
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found.' });
    }

    const updatedFriendship = await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: 'ACCEPTED' },
    });

    res.json({
      message: 'Friend request accepted.',
      friendship: updatedFriendship,
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ error: 'Failed to accept friend request.' });
  }
});

app.post('/api/friends/decline', authenticateToken, async (req, res) => {
  try {
    const receiverId = req.user.id;
    const { requesterId } = req.body;

    const friendship = await prisma.friendship.findFirst({
      where: {
        requesterId,
        receiverId,
        status: 'PENDING',
      },
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found.' });
    }

    const updatedFriendship = await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: 'DECLINED' },
    });

    res.json({
      message: 'Friend request declined.',
      friendship: updatedFriendship,
    });
  } catch (error) {
    console.error('Error declining friend request:', error);
    res.status(500).json({ error: 'Failed to decline friend request.' });
  }
});

// Remove a Friend
app.delete('/api/friends/remove', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'friendId is required.' });
    }

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, receiverId: friendId, status: 'ACCEPTED' },
          { requesterId: friendId, receiverId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found.' });
    }

    await prisma.friendship.delete({ where: { id: friendship.id } });

    res.json({ message: 'Friend removed successfully.' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Failed to remove friend.' });
  }
});

// Get Friends List
app.get('/api/friends/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        AND: [
          { status: 'ACCEPTED' },
          {
            OR: [{ requesterId: userId }, { receiverId: userId }],
          },
        ],
      },
      include: {
        requester: {
          select: { id: true, username: true },
        },
        receiver: {
          select: { id: true, username: true },
        },
      },
    });

    const friends = friendships.map((friendship) => {
      if (friendship.requesterId === userId) {
        return friendship.receiver;
      } else {
        return friendship.requester;
      }
    });

    res.json({ friends });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Failed to fetch friends.' });
  }
});

// Get Incoming Friend Requests
app.get('/api/friends/requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: { id: true, username: true },
        },
      },
    });

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ error: 'Failed to fetch friend requests.' });
  }
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

module.exports = app;
