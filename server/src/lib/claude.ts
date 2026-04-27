import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtractedSiteData {
  projectName: string | null;
  projectType: string | null;
  participants: Array<{
    companyName: string;
    role: string;
    confidence: "high" | "medium" | "low";
  }>;
  permitNumbers: string[];
  timeline: {
    startDate: string | null;
    completionDate: string | null;
  };
  additionalInfo: string | null;
  dataPoints: number;
}

const ANALYSIS_PROMPT = `You are analyzing a photo of a construction site to extract project intelligence.

Identify and extract all visible information:
1. Project name (from signboards, banners, permits, hoardings)
2. Contractor, subcontractor, architect, engineer, developer, or owner company names and any logos
3. Any permit or reference numbers
4. Project type (residential, commercial, infrastructure, industrial, etc.)
5. Timeline dates (start / estimated completion)
6. Any other relevant data visible in the image

Return ONLY valid JSON (no markdown, no explanation) matching this schema:
{
  "projectName": string | null,
  "projectType": string | null,
  "participants": [
    { "companyName": string, "role": "contractor"|"subcontractor"|"architect"|"engineer"|"developer"|"owner"|"other", "confidence": "high"|"medium"|"low" }
  ],
  "permitNumbers": string[],
  "timeline": { "startDate": string | null, "completionDate": string | null },
  "additionalInfo": string | null,
  "dataPoints": number
}

Count dataPoints as: 1 for projectName (if found) + 1 for projectType (if found) + 1 per participant identified. Minimum 0.`;

export async function analyzeConstructionPhoto(
  imagePath: string
): Promise<ExtractedSiteData> {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");
  const ext = path.extname(imagePath).toLowerCase();
  const mediaType =
    ext === ".png"
      ? "image/png"
      : ext === ".gif"
        ? "image/gif"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Image },
          },
          { type: "text", text: ANALYSIS_PROMPT },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    return JSON.parse(text) as ExtractedSiteData;
  } catch {
    return {
      projectName: null,
      projectType: null,
      participants: [],
      permitNumbers: [],
      timeline: { startDate: null, completionDate: null },
      additionalInfo: text.length > 0 ? text : null,
      dataPoints: 0,
    };
  }
}
