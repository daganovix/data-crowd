/**
 * Seed script — creates demo sites on the map so the app looks populated.
 * Run: npm run db:seed --workspace=server
 */
import "dotenv/config";
import { prisma } from "./lib/prisma";

const sites = [
  { latitude: 52.3680, longitude: 4.9036, projectName: "De Pijp Residential Tower", projectType: "residential", status: "verified" },
  { latitude: 52.3750, longitude: 4.8900, projectName: "Amsterdam West Office Park", projectType: "commercial", status: "approved" },
  { latitude: 52.3610, longitude: 4.8830, projectName: "RAI Convention Centre Expansion", projectType: "public", status: "verified" },
  { latitude: 51.9210, longitude: 4.4810, projectName: "Rotterdam Port Bridge", projectType: "infrastructure", status: "approved" },
  { latitude: 52.0700, longitude: 4.3020, projectName: "The Hague Central Station Renovation", projectType: "infrastructure", status: "approved" },
];

const participants = [
  ["BAM Construct", "contractor"],
  ["Heijmans", "contractor"],
  ["Arcadis", "architect"],
  ["VolkerWessels", "contractor"],
  ["Royal HaskoningDHV", "engineer"],
];

async function main() {
  console.log("Seeding database…");
  for (let i = 0; i < sites.length; i++) {
    const s = sites[i];
    const site = await prisma.site.create({ data: s });
    await prisma.participant.create({
      data: { siteId: site.id, companyName: participants[i][0], role: participants[i][1] },
    });
    console.log(`  Created: ${s.projectName}`);
  }
  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
