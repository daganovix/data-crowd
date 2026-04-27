import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { initiatePaypalPayout, PARTNER_REBATES } from "../services/paypal";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const [user, txns] = await Promise.all([
    prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { tokenBalance: true },
    }),
    prisma.tokenTransaction.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  res.json({ balance: user?.tokenBalance ?? 0, transactions: txns, partners: PARTNER_REBATES });
});

const RedeemSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("paypal"), tokens: z.number().int().min(1), paypalEmail: z.string().email() }),
  z.object({ method: z.literal("partner_rebate"), tokens: z.number().int().min(1), partnerId: z.string() }),
]);

router.post("/redeem", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = RedeemSchema.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: parse.error.flatten() }); return; }

  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { tokenBalance: true } });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const { method, tokens } = parse.data;

  if (user.tokenBalance < tokens) {
    res.status(400).json({ error: `Insufficient tokens. You have ${user.tokenBalance}, need ${tokens}.` });
    return;
  }

  if (method === "paypal") {
    const { paypalEmail } = parse.data as { method: "paypal"; tokens: number; paypalEmail: string };
    const result = await initiatePaypalPayout(paypalEmail, tokens, `Data Crowd payout: ${tokens} tokens = €${tokens}`);
    if (!result.success) {
      res.status(502).json({ error: result.error ?? "PayPal payout failed" });
      return;
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { tokenBalance: { decrement: tokens } } }),
      prisma.redemption.create({ data: { userId, amountTokens: tokens, method: "paypal", status: "processing", paypalEmail } }),
      prisma.tokenTransaction.create({ data: { userId, amount: -tokens, type: "redeemed", description: `PayPal payout €${tokens} to ${paypalEmail}` } }),
    ]);
    res.json({ success: true, message: `€${tokens} payout initiated to ${paypalEmail}. Expect arrival within 1–3 business days.` });
    return;
  }

  // Partner rebate
  const { partnerId } = parse.data as { method: "partner_rebate"; tokens: number; partnerId: string };
  const partner = PARTNER_REBATES.find((p) => p.id === partnerId);
  if (!partner) { res.status(400).json({ error: "Unknown partner" }); return; }
  if (tokens < partner.minTokens) {
    res.status(400).json({ error: `Minimum ${partner.minTokens} tokens required for ${partner.name}` });
    return;
  }

  const discountCode = `DC-${partnerId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { tokenBalance: { decrement: tokens } } }),
    prisma.redemption.create({ data: { userId, amountTokens: tokens, method: "partner_rebate", status: "completed", partnerName: partner.name, discountCode } }),
    prisma.tokenTransaction.create({ data: { userId, amount: -tokens, type: "redeemed", description: `Partner rebate: ${partner.name} — ${partner.discount}` } }),
  ]);
  res.json({ success: true, discountCode, partner: partner.name, discount: partner.discount, message: `Your code is ${discountCode}. Use it at ${partner.name}.` });
});

export default router;
