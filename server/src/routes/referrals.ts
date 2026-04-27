import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    include: {
      referred: { select: { name: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const appUrl = process.env.VITE_APP_URL ?? "http://localhost:5173";
  const referralLink = `${appUrl}/register?ref=${user?.referralCode}`;

  const enriched = await Promise.all(
    referrals.map(async (r) => {
      const approvedCount = await prisma.submission.count({
        where: { userId: r.referredId, status: "approved" },
      });
      return {
        id: r.id,
        name: r.referred.name,
        joinedAt: r.referred.createdAt,
        approvedSubmissions: approvedCount,
        rewardGiven: r.rewardGiven,
        progress: Math.min(approvedCount, 3),
      };
    })
  );

  res.json({
    referralCode: user?.referralCode,
    referralLink,
    referrals: enriched,
    totalEarned: enriched.filter((r) => r.rewardGiven).length * 3,
  });
});

export default router;
