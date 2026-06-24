import { PrismaClient } from './src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from 'better-auth/crypto';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const USER_EMAIL = process.env.TEST_USER_EMAIL ?? 'testuser@example.com';
const USER_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'testpassword123';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'testadmin@example.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'adminpassword123';

type Role = 'AGENT' | 'ADMIN';

async function upsertUser(
  email: string,
  name: string,
  rawPassword: string,
  role: Role,
): Promise<void> {
  const hash = await hashPassword(rawPassword);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({ where: { email }, data: { role } });
    await prisma.account.updateMany({
      where: { userId: existing.id, providerId: 'credential' },
      data: { password: hash },
    });
    console.log(`[seed] Updated user: ${email} (${role})`);
    return;
  }

  const id = crypto.randomUUID();
  await prisma.user.create({
    data: {
      id,
      name,
      email,
      emailVerified: true,
      role,
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: id,
          providerId: 'credential',
          password: hash,
        },
      },
    },
  });
  console.log(`[seed] Created user: ${email} (${role})`);
}

try {
  await upsertUser(USER_EMAIL, 'Test User', USER_PASSWORD, 'AGENT');
  await upsertUser(ADMIN_EMAIL, 'Test Admin', ADMIN_PASSWORD, 'ADMIN');
} finally {
  await prisma.$disconnect();
}
