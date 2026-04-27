import { Router, Response } from "express";
import path from "path";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { analyzeConstructionPhoto, ExtractedSiteData } from "../lib/claude";
import { checkAgainstHubexo } from "../services/hubexo";
import { calculateTokens, awardTokens } from "../services/rewards";

const router = Router();

const FormSubmitSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().optional(),
  projectName: z.string().optional(),
  projectType: z.string().optional(),
  participants: z
    .string()
    .optional()
    .transform((v) => {
      try { return v ? JSON.parse(v) : []; } catch { return []; }
    }),
});

router.get("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const submissions = await prisma.submission.findMany({
    where: { userId: req.user!.userId },
    include: { site: { select: { latitude: true, longitude: true, projectName: true, address: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(submissions);
});

router.get("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const sub = await prisma.submission.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    include: { site: { include: { participants: true } } },
  });
  if (!sub) { res.status(404).json({ error: "Submission not found" }); return; }
  res.json(sub);
});

// Analyze a photo without persisting — used for preview step
router.post("/analyze", requireAuth, upload.single("image"), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: "Image file required" }); return; }
  try {
    const data = await analyzeConstructionPhoto(req.file.path);
    res.json({ extracted: data, imageUrl: `/api/uploads/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ error: "Photo analysis failed", detail: (err as Error).message });
  }
});

// Create a full submission (photo or form)
router.post("/", requireAuth, upload.single("image"), async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = FormSubmitSchema.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: parse.error.flatten() }); return; }

  const { latitude, longitude, address, projectName, projectType, participants } = parse.data;
  const userId = req.user!.userId;

  // Hubexo duplicate check
  const hubexoResult = await checkAgainstHubexo(latitude, longitude, projectName);
  if (hubexoResult.isDuplicate) {
    res.status(200).json({
      duplicate: true,
      message: `Thank you for your contribution! This project (${hubexoResult.matchedProject ?? "unknown"}) is already in our database. Keep exploring — there are many undiscovered sites out there!`,
    });
    return;
  }

  let extractedData: ExtractedSiteData | null = null;
  let imageUrl: string | undefined;

  if (req.file) {
    imageUrl = `/api/uploads/${req.file.filename}`;
    try {
      extractedData = await analyzeConstructionPhoto(req.file.path);
    } catch {
      // Photo analysis failed; continue with form data
    }
  }

  // Merge form data over AI-extracted data
  const finalProjectName = projectName ?? extractedData?.projectName ?? null;
  const finalProjectType = projectType ?? extractedData?.projectType ?? null;
  const finalParticipants: Array<{ companyName: string; role: string }> =
    (participants as Array<{ companyName: string; role?: string }> | undefined)?.length
      ? participants
      : (extractedData?.participants ?? []).map((p) => ({ companyName: p.companyName, role: p.role }));

  const dataPoints =
    (finalProjectName ? 1 : 0) +
    (finalProjectType ? 1 : 0) +
    finalParticipants.length;

  // Upsert site — find if an existing site is within 50m
  const nearbySites = await prisma.site.findMany({
    where: { status: { not: "declined" } },
    select: { id: true, latitude: true, longitude: true },
  });

  let siteId: string;
  const nearby = nearbySites.find((s) => {
    const d = Math.sqrt((s.latitude - latitude) ** 2 + (s.longitude - longitude) ** 2);
    return d < 0.0005; // ~55m
  });

  if (nearby) {
    siteId = nearby.id;
    // Only update if we have richer data
    if (finalProjectName || finalProjectType) {
      await prisma.site.update({
        where: { id: siteId },
        data: {
          projectName: finalProjectName ?? undefined,
          projectType: finalProjectType ?? undefined,
          address: address ?? undefined,
        },
      });
    }
  } else {
    const site = await prisma.site.create({
      data: { latitude, longitude, address, projectName: finalProjectName, projectType: finalProjectType },
    });
    siteId = site.id;
  }

  // Add new participants
  if (finalParticipants.length > 0) {
    const existing = await prisma.participant.findMany({
      where: { siteId },
      select: { companyName: true },
    });
    const existingNames = new Set(existing.map((p) => p.companyName.toLowerCase()));
    const newParticipants = finalParticipants.filter(
      (p) => !existingNames.has(p.companyName.toLowerCase())
    );
    if (newParticipants.length > 0) {
      await prisma.participant.createMany({
        data: newParticipants.map((p) => ({ siteId, companyName: p.companyName, role: p.role })),
      });
    }
  }

  const tokens = calculateTokens({ dataPoints });
  const submission = await prisma.submission.create({
    data: {
      siteId,
      userId,
      type: req.file ? "photo" : "form",
      imageUrl,
      extractedData: extractedData ? JSON.stringify(extractedData) : null,
      rawFormData: JSON.stringify({ projectName, projectType, participants, address }),
      status: "approved",
      tokensAwarded: tokens,
      dataPoints,
    },
  });

  await awardTokens(
    userId,
    submission.id,
    tokens,
    `Verified submission: ${finalProjectName ?? "construction site"} (${dataPoints} data points)`
  );

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenBalance: true },
  });

  res.status(201).json({
    duplicate: false,
    submission,
    tokensAwarded: tokens,
    newBalance: updatedUser?.tokenBalance ?? 0,
    message: `Excellent! You earned ${tokens} token${tokens !== 1 ? "s" : ""} for discovering new project intelligence!`,
  });
});

export default router;
