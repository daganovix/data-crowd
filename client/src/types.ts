export interface User {
  id: string;
  name: string;
  email: string;
  paypalEmail?: string | null;
  tokenBalance: number;
  referralCode: string;
  createdAt?: string;
}

export interface Participant {
  id?: string;
  companyName: string;
  role?: string;
  logoUrl?: string;
}

export interface Site {
  id: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  projectName?: string | null;
  projectType?: string | null;
  status: "pending" | "approved" | "verified" | "declined" | "duplicate";
  hubexoId?: string | null;
  createdAt: string;
  participants?: Participant[];
  _count?: { submissions: number };
}

export interface Submission {
  id: string;
  siteId: string;
  userId?: string;
  type: "photo" | "form";
  imageUrl?: string | null;
  extractedData?: string | null;
  rawFormData?: string | null;
  status: "pending" | "approved" | "rejected" | "duplicate";
  tokensAwarded: number;
  dataPoints: number;
  notes?: string | null;
  createdAt: string;
  site?: {
    latitude: number;
    longitude: number;
    projectName?: string | null;
    address?: string | null;
  };
}

export interface TokenTransaction {
  id: string;
  amount: number;
  type: "earned" | "redeemed" | "referral_bonus";
  description: string;
  createdAt: string;
}

export interface Redemption {
  id: string;
  amountTokens: number;
  method: "paypal" | "partner_rebate";
  status: "pending" | "processing" | "completed" | "failed";
  paypalEmail?: string | null;
  partnerName?: string | null;
  discountCode?: string | null;
  createdAt: string;
}

export interface PartnerRebate {
  id: string;
  name: string;
  discount: string;
  minTokens: number;
}

export interface ReferralContact {
  id: string;
  name: string;
  joinedAt: string;
  approvedSubmissions: number;
  rewardGiven: boolean;
  progress: number;
}

export interface ExtractedData {
  projectName?: string | null;
  projectType?: string | null;
  participants?: Array<{ companyName: string; role: string; confidence: string }>;
  permitNumbers?: string[];
  timeline?: { startDate?: string | null; completionDate?: string | null };
  additionalInfo?: string | null;
  dataPoints?: number;
}
