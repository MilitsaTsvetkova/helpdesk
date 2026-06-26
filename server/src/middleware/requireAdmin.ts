import type { Request, Response, NextFunction } from "express";
import { Role } from "core";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== Role.ADMIN) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
