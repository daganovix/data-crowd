/**
 * Mock Hubexo project database check.
 * Replace with real API call when credentials are available:
 *   POST ${HUBEXO_API_URL}/projects/check
 *   Authorization: Bearer ${HUBEXO_API_KEY}
 */

interface HubexoProject {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
}

const MOCK_DB: HubexoProject[] = [
  { id: "hx-001", name: "City Hall Renovation", latitude: 52.3702, longitude: 4.8952, type: "public" },
  { id: "hx-002", name: "Harbour Bridge Extension", latitude: 51.9225, longitude: 4.4792, type: "infrastructure" },
  { id: "hx-003", name: "The Hague Office Tower", latitude: 52.0705, longitude: 4.3007, type: "commercial" },
];

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface HubexoCheckResult {
  isDuplicate: boolean;
  hubexoId?: string;
  matchedProject?: string;
}

export async function checkAgainstHubexo(
  latitude: number,
  longitude: number,
  projectName?: string | null
): Promise<HubexoCheckResult> {
  // Real implementation would call HUBEXO_API_URL here
  for (const project of MOCK_DB) {
    const distMeters = haversineMeters(latitude, longitude, project.latitude, project.longitude);
    const withinRadius = distMeters < 150;
    const nameMatch =
      projectName &&
      project.name.toLowerCase().includes(projectName.toLowerCase().slice(0, 5));

    if (withinRadius || nameMatch) {
      return { isDuplicate: true, hubexoId: project.id, matchedProject: project.name };
    }
  }
  return { isDuplicate: false };
}
