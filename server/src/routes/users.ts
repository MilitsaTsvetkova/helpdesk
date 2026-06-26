import bcrypt from "bcryptjs";
import { Router, type Response } from "express";
import { type ZodType } from "zod";
import { createUserSchema, editUserSchema } from "core";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/requireAdmin";
import { requireAuth } from "../middleware/requireAuth";

function validate<T>(schema: ZodType<T>, body: unknown, res: Response): T | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return null;
  }
  return result.data;
}

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
  const data = validate(createUserSchema, req.body, res);
  if (!data) return;
  const { name, email, password } = data;

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
      data: {
        id,
        name,
        email,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
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

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const data = validate(editUserSchema, req.body, res);
  if (!data) return;
  const { name, email, password } = data;
  const id = req.params.id as string;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  if (email !== existing.email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) {
      res.status(409).json({ error: "A user with that email already exists." });
      return;
    }
  }

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: { name, email, updatedAt: new Date() },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await tx.account.updateMany({
        where: { userId: id, providerId: "credential" },
        data: { password: hashed, updatedAt: new Date() },
      });
    }

    return updated;
  });

  res.json(user);
});

export default router;
