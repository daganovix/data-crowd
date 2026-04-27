import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, paypalEmail: true, tokenBalance: true, referralCode: true, createdAt: true },
  });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(user);
});

const UpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  paypalEmail: z.string().email().optional().nullable(),
});

router.put("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = UpdateSchema.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: parse.error.flatten() }); return; }

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: parse.data,
    select: { id: true, name: true, email: true, paypalEmail: true, tokenBalance: true, referralCode: true },
  });
  res.json(user);
});

export default router;
