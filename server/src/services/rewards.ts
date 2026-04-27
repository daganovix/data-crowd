import { prisma } from "../lib/prisma";
import { ExtractedSiteData } from "../lib/claude";

const REFERRAL_THRESHOLD = 3;
const REFERRAL_BONUS = 3;

export function calculateTokens(data: Partial<ExtractedSiteData> & { dataPoints?: number }): number {
  if (data.dataPoints !== undefined) return Math.min(data.dataPoints, 5);
  let count = 0;
  if (data.projectName) count++;
  if (data.projectType) count++;
  count += (data.participants ?? []).length;
  return Math.min(count, 5);
}

export async function awardTokens(
  userId: string,
  submissionId: string,
  tokens: number,
  description: string
): Promise<void> {
  await prisma.$transaction([
    prisma.tokenTransaction.create({
      data: { userId, amount: tokens, type: "earned", description, submissionId },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { tokenBalance: { increment: tokens } },
    }),
  ]);

  await checkReferralProgress(userId);
}

async function checkReferralProgress(userId: string): Promise<void> {
  const referral = await prisma.referral.findFirst({
    where: { referredId: userId, rewardGiven: false },
  });
  if (!referral) return;

  const approvedSubmissions = await prisma.submission.count({
    where: { userId, status: "approved" },
  });

  const newPointsCount = Math.min(approvedSubmissions, REFERRAL_THRESHOLD);
  await prisma.referral.update({
    where: { id: referral.id },
    data: { pointsCount: newPointsCount },
  });

  if (newPointsCount >= REFERRAL_THRESHOLD) {
    await prisma.$transaction([
      prisma.referral.update({
        where: { id: referral.id },
        data: { rewardGiven: true },
      }),
      prisma.tokenTransaction.create({
        data: {
          userId: referral.referrerId,
          amount: REFERRAL_BONUS,
          type: "referral_bonus",
          description: `Finder's reward: your invite reached ${REFERRAL_THRESHOLD} verified submissions`,
        },
      }),
      prisma.user.update({
        where: { id: referral.referrerId },
        data: { tokenBalance: { increment: REFERRAL_BONUS } },
      }),
    ]);
  }
}
