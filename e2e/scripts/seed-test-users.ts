/**
 * Seed script — run by e2e/auth.setup.ts before the test suite.
 *
 * Must be executed from the server/ directory so that Prisma and better-auth
 * resolve from server/node_modules:
 *
 *   DATABASE_URL=<url> bun run ../e2e/scripts/seed-test-users.ts
 *   (cwd = helpdesk/server/)
 *
 * Upserts two test users into helpdesk_test:
 *   1. AGENT user: TEST_USER_EMAIL / TEST_USER_PASSWORD
 *   2. ADMIN user: TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD
 *
 * Password hashing uses better-auth/crypto so the hash format is compatible
 * with what Better Auth expects when verifying passwords at login.
 *
 * The script is idempotent — safe to run multiple times.
 */

import { PrismaClient } from '../../server/src/generated/prisma/client.js';
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
    // Refresh role and password hash so credential changes in .env.test take effect
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
