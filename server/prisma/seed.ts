import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../src/lib/prisma";

// Separate instance with signup enabled — only used here in the seed
const seedAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
});

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const ctx = await seedAuth.api.signUpEmail({
      body: { email, password, name: "Admin" },
    });
    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { role: "ADMIN" },
    });
    console.log(`Admin user created: ${ctx.user.email} (${ctx.user.id})`);
  } else {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN" },
    });
    console.log(`Admin user already exists: ${existing.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
