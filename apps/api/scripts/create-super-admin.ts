import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL || process.argv[2];
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || process.argv[3];
  const name = process.env.BOOTSTRAP_ADMIN_NAME || process.argv[4] || 'Super Administrator';

  if (!email || !password) {
    console.error('Error: Email and password must be provided.');
    console.log('Usage: npx ts-node scripts/create-super-admin.ts <email> <password> [name]');
    console.log('Or set BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD, and BOOTSTRAP_ADMIN_NAME in .env');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (password.length < 8) {
    console.error('Error: Super admin password must be at least 8 characters long.');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    if (existing.role === Role.SUPER_ADMIN) {
      console.log(`User ${normalizedEmail} is already a SUPER_ADMIN. Updating details...`);
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: name.trim(),
          passwordHash,
          status: UserStatus.ACTIVE,
        },
      });
      console.log(`Successfully updated SUPER_ADMIN account: ${normalizedEmail}`);
    } else {
      console.log(`Upgrading existing user ${normalizedEmail} to SUPER_ADMIN role...`);
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: Role.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
        },
      });
      console.log(`Successfully elevated ${normalizedEmail} to SUPER_ADMIN role.`);
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
        role: Role.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'SUPER_ADMIN_BOOTSTRAP',
        entityType: 'User',
        entityId: user.id,
        metadata: {
          email: user.email,
          role: user.role,
        },
      },
    });

    console.log(`Successfully created new SUPER_ADMIN user: [${user.id}] ${user.email}`);
  }

  await prisma.$disconnect();
}

createSuperAdmin().catch((err) => {
  console.error('Failed to create super admin:', err);
  prisma.$disconnect().finally(() => process.exit(1));
});
