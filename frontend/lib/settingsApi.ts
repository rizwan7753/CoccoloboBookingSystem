const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface PublicSettings {
  name: string;
  timezone: string;
  currency: string;
}

const FALLBACK: PublicSettings = { name: "Cocolobo Beach Club", timezone: "America/St_Thomas", currency: "USD" };

export const settingsApi = {
  // Never throws — branding falls back gracefully if the API is unreachable
  // (e.g. during a build with no backend running), rather than breaking the
  // header/footer on every guest page.
  getSettings: async (): Promise<PublicSettings> => {
    try {
      const res = await fetch(`${API_URL}/settings`, { next: { revalidate: 60 } });
      if (!res.ok) return FALLBACK;
      return await res.json();
    } catch {
      return FALLBACK;
    }
  },
};
