export class ClientModelFetcher {
  static async fetchDirect(provider: string, apiKey: string): Promise<string[]> {
    const cleanKey = apiKey.trim();
    if (!cleanKey) return [];

    if (provider === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Google Gemini API error (${res.status})`);
      }
      const data = await res.json();
      if (data.models && Array.isArray(data.models)) {
        const models = data.models
          .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m: any) => m.name.replace(/^models\//, ""))
          .filter((name: string) => !name.includes("embedding") && !name.includes("aqa"));

        const priority = [
          "gemini-2.5-flash",
          "gemini-2.5-pro",
          "gemini-2.0-flash",
          "gemini-2.0-flash-exp",
          "gemini-1.5-flash",
          "gemini-1.5-flash-8b",
          "gemini-1.5-pro",
        ];

        models.sort((a: string, b: string) => {
          const indexA = priority.indexOf(a);
          const indexB = priority.indexOf(b);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return a.localeCompare(b);
        });

        return models;
      }
    }

    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${cleanKey}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `OpenAI API error (${res.status})`);
      }
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        const models = data.data
          .map((m: any) => m.id)
          .filter((id: string) => id.includes("gpt") || id.startsWith("o1") || id.startsWith("o3"))
          .sort();
        const priority = ["gpt-4o-mini", "gpt-4o", "o3-mini", "o1-mini", "gpt-4-turbo"];
        models.sort((a: string, b: string) => {
          const indexA = priority.indexOf(a);
          const indexB = priority.indexOf(b);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return a.localeCompare(b);
        });
        return models;
      }
    }

    if (provider === "ollama") {
      const endpoint = cleanKey.startsWith("http") ? cleanKey : "http://localhost:11434";
      const res = await fetch(`${endpoint}/api/tags`);
      if (res.ok) {
        const data = await res.json();
        if (data.models && Array.isArray(data.models)) {
          return data.models.map((m: any) => m.name);
        }
      }
    }

    return [];
  }
}
