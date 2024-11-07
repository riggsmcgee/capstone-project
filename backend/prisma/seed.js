const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const cleanDatabase = async () => {
  try {
    console.log('Cleaning up existing data...');

    await prisma.queryUser.deleteMany({});
    await prisma.friendship.deleteMany({});
    await prisma.query.deleteMany({});
    await prisma.calendar.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.queryType.deleteMany({});
    await prisma.role.deleteMany({});

    await prisma.$executeRaw`ALTER SEQUENCE "Role_id_seq" RESTART WITH 1;`;
    await prisma.$executeRaw`ALTER SEQUENCE "User_id_seq" RESTART WITH 1;`;
    await prisma.$executeRaw`ALTER SEQUENCE "Query_id_seq" RESTART WITH 1;`;
    await prisma.$executeRaw`ALTER SEQUENCE "QueryType_id_seq" RESTART WITH 1;`;
    await prisma.$executeRaw`ALTER SEQUENCE "Calendar_id_seq" RESTART WITH 1;`;

    console.log('Database cleaned successfully');
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
};

async function main() {
  try {
    await cleanDatabase();
    console.log('Starting database seed...');
    await prisma.query.deleteMany({});
    await prisma.calendar.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.queryType.deleteMany({});
    await prisma.role.deleteMany({});

    console.log('Cleaned up existing data');

    const adminRole = await prisma.role.create({
      data: { name: 'ADMIN' },
    });

    const userRole = await prisma.role.create({
      data: { name: 'USER' },
    });

    console.log('Created roles');

    const queryTypes = await Promise.all([
      prisma.queryType.create({
        data: { name: 'PROMPT' },
      }),
      prisma.queryType.create({
        data: { name: 'ANSWER' },
      }),
    ]);

    console.log('Created query types');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: adminPassword,
        roleId: adminRole.id,
      },
    });

    const userPassword = await bcrypt.hash('user123', 10);
    const user1 = await prisma.user.create({
      data: {
        username: 'user1',
        passwordHash: userPassword,
        roleId: userRole.id,
      },
    });

    const user2 = await prisma.user.create({
      data: {
        username: 'user2',
        passwordHash: userPassword,
        roleId: userRole.id,
      },
    });

    console.log('Created users');

    await Promise.all([
      prisma.query.create({
        data: {
          userId: user1.id,
          typeId: queryTypes[0].id,
          content: 'What is my availability',
        },
      }),
      prisma.query.create({
        data: {
          userId: user1.id,
          typeId: queryTypes[1].id,
          content: 'You are free on Monday at 1pm',
        },
      }),
    ]);

    console.log('Created queries');

    await Promise.all([
      prisma.calendar.create({
        data: {
          userId: user1.id,
          availability: JSON.stringify({
            monday: ['9:00-12:00', '13:00-17:00'],
            tuesday: ['10:00-15:00'],
            wednesday: ['9:00-17:00'],
            thursday: ['13:00-18:00'],
            friday: ['9:00-13:00'],
          }),
        },
      }),
      prisma.calendar.create({
        data: {
          userId: user2.id,
          availability: JSON.stringify({
            monday: ['11:00-16:00'],
            wednesday: ['9:00-14:00'],
            friday: ['13:00-17:00'],
          }),
        },
      }),
    ]);

    console.log('Created calendars');
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
