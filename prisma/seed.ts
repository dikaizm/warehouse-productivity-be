import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays, subDays, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  // Type-safe way to add the new fields
  type RoleData = {
    name: string;
    description: string;
    editAccess: boolean;
    viewAccess: boolean;
  };

  // Create roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'kepala_gudang' },
      update: {
        description: 'Kepala Bagian Gudang - Full access to manage warehouse operations',
        editAccess: true,
        viewAccess: true,
      },
      create: {
        name: 'kepala_gudang',
        description: 'Kepala Bagian Gudang - Full access to manage warehouse operations',
        editAccess: true,
        viewAccess: true,
      } as any as RoleData,
    }),
    prisma.role.upsert({
      where: { name: 'admin_logistik' },
      update: {
        description: 'Admin Logistik - View-only access for monitoring logistics',
        editAccess: false,
        viewAccess: true,
      },
      create: {
        name: 'admin_logistik',
        description: 'Admin Logistik - View-only access for monitoring logistics',
        editAccess: false,
        viewAccess: true,
      } as any as RoleData,
    }),
    prisma.role.upsert({
      where: { name: 'operasional' },
      update: {
        description: 'Tenaga Kerja Operasional - View-only access for daily operations',
        editAccess: false,
        viewAccess: true,
      },
      create: {
        name: 'operasional',
        description: 'Tenaga Kerja Operasional - View-only access for daily operations',
        editAccess: false,
        viewAccess: true,
      } as any as RoleData,
    }),
  ]);

  const subRoles = await Promise.all([
    prisma.subRole.upsert({
      where: { name: 'leader_incoming' },
      create: {
        name: 'leader_incoming',
        roleId: roles[2].id,
      },
      update: {
        name: 'leader_incoming',
        roleId: roles[2].id,
      },
    }),

    prisma.subRole.upsert({
      where: { name: 'good_receive' },
      create: {
        name: 'good_receive',
        roleId: roles[2].id,
      },
      update: {
        name: 'good_receive',
        roleId: roles[2].id,
      },
    }),

    prisma.subRole.upsert({
      where: { name: 'quality_inspection' },
      create: {
        name: 'quality_inspection',
        roleId: roles[2].id,
      },
      update: {
        name: 'quality_inspection',
        roleId: roles[2].id,
      },
    }),

    prisma.subRole.upsert({
      where: { name: 'binning' },
      create: {
        name: 'binning',
        roleId: roles[2].id,
      },
      update: {
        name: 'binning',
        roleId: roles[2].id,
      },
    }),

    prisma.subRole.upsert({
      where: { name: 'leader_outgoing' },
      create: {
        name: 'leader_outgoing',
        roleId: roles[2].id,
      },
      update: {
        name: 'leader_outgoing',
        roleId: roles[2].id,
      },
    }),

    prisma.subRole.upsert({
      where: { name: 'picking' },
      create: {
        name: 'picking',
        roleId: roles[2].id,
      },
      update: {
        name: 'picking',
        roleId: roles[2].id,
      },
    }),

    prisma.subRole.upsert({
      where: { name: 'quality_control' },
      create: {
        name: 'quality_control',
        roleId: roles[2].id,
      },
      update: {
        name: 'quality_control',
        roleId: roles[2].id,
      },
    }),

    prisma.subRole.upsert({
      where: { name: 'kg_none' },
      create: {
        name: 'kg_none',
        roleId: roles[0].id,
      },
      update: {
        name: 'kg_none',
        roleId: roles[0].id,
      },
    }),

    prisma.subRole.upsert({
      where: { name: 'admin_none' },
      create: {
        name: 'admin_none',
        roleId: roles[1].id,
      },
      update: {
        name: 'admin_none',
        roleId: roles[1].id,
      },
    }),
  ]);

  // Create users with actual person names
  const users = await Promise.all([
    // Kepala Gudang Staff
    prisma.user.upsert({
      where: { username: 'budi_santoso' },
      update: {
        email: 'budi.santoso@example.com',
        fullName: 'Budi Santoso',
        roleId: roles[0].id
      },
      create: {
        username: 'budi_santoso',
        email: 'budi.santoso@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        fullName: 'Budi Santoso',
        roleId: roles[0].id, // kepala_gudang role
        subRoleId: subRoles[0].id,
      },
      include: {
        role: true,
        subRole: true,
      },
    }),
    // Admin Logistik Staff
    prisma.user.upsert({
      where: { username: 'siti_rahma' },
      update: {
        email: 'siti.rahma@example.com',
        fullName: 'Siti Rahma',
        roleId: roles[1].id
      },
      create: {
        username: 'siti_rahma',
        email: 'siti.rahma@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        fullName: 'Siti Rahma',
        roleId: roles[1].id, // admin_logistik role
        subRoleId: subRoles[1].id,
      },
      include: {
        role: true,
        subRole: true,
      },
    }),
    // Operasional Staff
    prisma.user.upsert({
      where: { username: 'ahmad_yusuf' },
      update: {
        email: 'ahmad.yusuf@example.com',
        fullName: 'Ahmad Yusuf',
        roleId: roles[2].id
      },
      create: {
        username: 'ahmad_yusuf',
        email: 'ahmad.yusuf@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        fullName: 'Ahmad Yusuf',
        roleId: roles[2].id, // operasional role
        subRoleId: subRoles[2].id,
      },
      include: {
        role: true,
        subRole: true,
      },
    }),
  ]);

  // First delete all existing attendance records and daily logs
  console.log('Cleaning up existing attendance records and daily logs...');
  await prisma.attendance.deleteMany({});
  await prisma.dailyLog.deleteMany({});

  // Create daily logs for the last 30 days
  console.log('Creating daily logs for the last 30 days...');
  const today = startOfDay(new Date());
  const dailyLogs = await Promise.all(
    Array.from({ length: 30 }, async (_, index) => {
      const date = subDays(today, index);
      const isSunday = date.getDay() === 0; // Only Sunday is non-workday

      // Generate realistic productivity data
      // Sunday has lower productivity
      const baseBinning = isSunday ? 50 : 150;
      const basePicking = isSunday ? 30 : 100;

      // Add some random variation (±20%)
      const binningCount = Math.floor(baseBinning * (0.8 + Math.random() * 0.4));
      const pickingCount = Math.floor(basePicking * (0.8 + Math.random() * 0.4));
      const totalItems = binningCount + pickingCount;

      // Create daily log
      const dailyLog = await prisma.dailyLog.create({
        data: {
          logDate: date,
          binningCount,
          pickingCount,
          totalItems,
          issueNotes: Math.random() < 0.1 ? 'Some operational notes for the day' : null,
        }
      });

      // Create attendance records for each user
      const attendancePromises = users.map(async (user) => {
        return prisma.attendance.create({
          data: {
            dailyLogId: dailyLog.id,
            operatorId: user.id,
          }
        });
      });

      await Promise.all(attendancePromises);
      return dailyLog;
    })
  );

  console.log('Database has been seeded. 🌱');
  console.log('Created roles:', roles);
  console.log('Created users:', users.map(u => ({
    fullName: u.fullName,
    username: u.username,
    role: u.role.name,
    subRole: u.subRole.name
  })));
  console.log('Created daily logs:', dailyLogs.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 