import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create roles
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        name: 'editor',
        description: 'Kepala Bagian Gudang - Full access to manage warehouse operations',
      },
    }),
    prisma.role.create({
      data: {
        name: 'viewer',
        description: 'View-only access for admin logistik and tenaga kerja operasional',
      },
    }),
  ]);

  // Create users
  const users = await Promise.all([
    // Kepala Bagian Gudang (Editor)
    prisma.user.create({
      data: {
        username: 'kepala_gudang',
        email: 'kepala.gudang@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        fullName: 'Kepala Bagian Gudang',
        roleId: roles[0].id
      },
      include: {
        role: true
      }
    }),
    // Admin Logistik (Viewer)
    prisma.user.create({
      data: {
        username: 'admin_logistik',
        email: 'admin.logistik@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        fullName: 'Admin Logistik',
        roleId: roles[1].id
      },
      include: {
        role: true
      }
    }),
    // Tenaga Kerja Operasional (Viewer)
    prisma.user.create({
      data: {
        username: 'tenaga_operasional',
        email: 'tenaga.operasional@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        fullName: 'Tenaga Kerja Operasional',
        roleId: roles[1].id
      },
      include: {
        role: true
      }
    }),
  ]);

  console.log('Database has been seeded. 🌱');
  console.log('Created roles:', roles);
  console.log('Created users:', users.map(u => ({ 
    username: u.username, 
    role: u.role.name 
  })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 