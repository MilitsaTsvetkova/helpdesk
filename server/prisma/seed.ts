import "dotenv/config";
import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../src/lib/prisma";

// Separate instance with signup enabled — only used here in the seed
const seedAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
});

const AGENTS = [
  { name: "Alice Chen", email: "alice@example.com", password: "alice1234" },
  { name: "Bob Martinez", email: "bob@example.com", password: "bob12345" },
  { name: "Carol Wright", email: "carol@example.com", password: "carol123" },
];

async function upsertAgent(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Agent already exists: ${email}`);
    return existing;
  }
  const id = crypto.randomUUID();
  const now = new Date();
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { id, name, email, emailVerified: false, role: "AGENT", createdAt: now, updatedAt: now },
  });
  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: hashed,
      createdAt: now,
      updatedAt: now,
    },
  });
  console.log(`Agent created: ${email}`);
  return user;
}

async function main() {
  // Admin
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set");
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const ctx = await seedAuth.api.signUpEmail({
      body: { email: adminEmail, password: adminPassword, name: "Admin" },
    });
    await prisma.user.update({ where: { id: ctx.user.id }, data: { role: "ADMIN" } });
    console.log(`Admin user created: ${ctx.user.email} (${ctx.user.id})`);
  } else {
    await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
    console.log(`Admin user already exists: ${existing.email}`);
  }

  // Agents
  const [alice, bob, carol] = await Promise.all(
    AGENTS.map(({ name, email, password }) => upsertAgent(name, email, password)),
  );

  // Sample tickets (skip if there are already tickets in the DB)
  const ticketCount = await prisma.ticket.count();
  if (ticketCount > 0) {
    console.log(`Skipping ticket seed — ${ticketCount} ticket(s) already exist.`);
    return;
  }

  const now = new Date();
  const tickets = [
    {
      subject: "Cannot log in to my account",
      body: "Hi, I've been trying to log in for the past hour but keep getting an 'invalid credentials' error. I'm sure my password is correct. Can you help?",
      fromEmail: "john.doe@acme.com",
      fromName: "John Doe",
      status: "OPEN" as const,
      source: "EMAIL" as const,
      assignedToId: alice.id,
    },
    {
      subject: "Keyboard not working after update",
      body: "Since the latest software update, my keyboard shortcuts have stopped working. Arrow keys and Ctrl+C / Ctrl+V no longer respond.",
      fromEmail: "sarah.k@widgets.io",
      fromName: "Sarah Kim",
      status: "IN_PROGRESS" as const,
      source: "EMAIL" as const,
      assignedToId: alice.id,
    },
    {
      subject: "Need access to the reporting dashboard",
      body: "I joined the finance team last week and still don't have access to the reporting dashboard. My manager is Emma Taylor. Please grant me viewer access.",
      fromEmail: "mike.chen@globex.com",
      fromName: "Mike Chen",
      status: "OPEN" as const,
      source: "EMAIL" as const,
      assignedToId: bob.id,
    },
    {
      subject: "Screen flickering on external monitor",
      body: "My external monitor has been flickering intermittently since yesterday. It happens every 10–15 minutes and lasts about 5 seconds. Driver is up to date.",
      fromEmail: "priya.p@initech.net",
      fromName: "Priya Patel",
      status: "OPEN" as const,
      source: "EMAIL" as const,
      assignedToId: bob.id,
    },
    {
      subject: "Printer offline — urgent",
      body: "The shared printer on the 3rd floor is showing as offline. We have client documents to print before 2 pm. Please fix ASAP.",
      fromEmail: "tom.w@umbrella.co",
      fromName: "Tom Wilson",
      status: "RESOLVED" as const,
      source: "EMAIL" as const,
      assignedToId: carol.id,
    },
    {
      subject: "VPN connection dropping every 30 minutes",
      body: "Working from home today and my VPN keeps dropping every ~30 minutes. Have to reconnect manually each time. This is blocking my work.",
      fromEmail: "linda.s@capsule.com",
      fromName: "Linda Su",
      status: "IN_PROGRESS" as const,
      source: "EMAIL" as const,
      assignedToId: carol.id,
    },
    {
      subject: "Request for second monitor",
      body: "I'd like to request a second monitor for my workstation. My current single-monitor setup is limiting my productivity when working across multiple applications.",
      fromEmail: "alex.m@initech.net",
      fromName: "Alex Morgan",
      status: "OPEN" as const,
      source: "EMAIL" as const,
      assignedToId: null,
    },
    {
      subject: "Software installation request — Adobe Acrobat",
      body: "I need Adobe Acrobat Pro installed for reviewing and signing contracts. Please let me know if you need manager approval.",
      fromEmail: "diana.r@acme.com",
      fromName: "Diana Reyes",
      status: "OPEN" as const,
      source: "EMAIL" as const,
      assignedToId: null,
    },
  ];

  await prisma.ticket.createMany({
    data: tickets.map((t, i) => ({
      ...t,
      createdAt: new Date(now.getTime() - (tickets.length - i) * 3_600_000),
      updatedAt: now,
    })),
  });

  console.log(`Created ${tickets.length} sample tickets.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
