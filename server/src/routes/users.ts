import { Router } from "express";
import bcrypt from "bcryptjs";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, email, password } = req.body;

  if (typeof name !== "string" || name.trim().length < 3) {
    res.status(400).json({ error: "Name must be at least 3 characters." });
    return;
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "A valid email is required." });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "A user with that email already exists." });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();
  const accountId = crypto.randomUUID();
  const now = new Date();

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { id, name: name.trim(), email, emailVerified: false, createdAt: now, updatedAt: now },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    await tx.account.create({
      data: {
        id: accountId,
        accountId: id,
        providerId: "credential",
        userId: id,
        password: hashed,
        createdAt: now,
        updatedAt: now,
      },
    });
    return created;
  });

  res.status(201).json(user);
});

export default router;
