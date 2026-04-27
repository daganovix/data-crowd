import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  const sites = await prisma.site.findMany({
    select: {
      id: true,
      latitude: true,
      longitude: true,
      projectName: true,
      projectType: true,
      status: true,
      createdAt: true,
      participants: { select: { companyName: true, role: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(sites);
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const site = await prisma.site.findUnique({
    where: { id: req.params.id },
    include: {
      participants: true,
      submissions: {
        select: { id: true, type: true, status: true, tokensAwarded: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!site) { res.status(404).json({ error: "Site not found" }); return; }
  res.json(site);
});

router.get("/:id/image/:filename", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const path = require("path");
  const fs = require("fs");
  const filePath = path.join(__dirname, "../../uploads", req.params.filename);
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: "Image not found" }); return; }
  res.sendFile(filePath);
});

export default router;
