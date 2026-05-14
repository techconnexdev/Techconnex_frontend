const API_URL = process.env.NEXT_PUBLIC_API_URL;

function normalizeLocale(locale: string): string {
  const base = locale.split(/[-_]/)[0]?.toLowerCase() || "en";
  if (base === "id" || base === "ar" || base === "en") return base;
  return "en";
}

export async function translateMessagesBatch(
  token: string,
  items: { id: string; content: string }[],
  targetLocale: string,
): Promise<Map<string, string>> {
  const res = await fetch(`${API_URL}/messages/translate-batch`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items,
      targetLocale: normalizeLocale(targetLocale),
    }),
  });

  const data = (await res.json()) as {
    success?: boolean;
    translations?: Array<{ id?: string; translatedContent?: string | null }>;
    message?: string;
    code?: string;
  };

  if (!res.ok || !data.success) {
    const msg =
      typeof data.message === "string" && data.message.trim()
        ? data.message
        : "Translation failed";
    throw new Error(msg);
  }

  if (!Array.isArray(data.translations)) {
    throw new Error(
      typeof data.message === "string" && data.message.trim()
        ? data.message
        : "Translation failed",
    );
  }

  const map = new Map<string, string>();
  for (const row of data.translations) {
    if (
      row?.id != null &&
      row.translatedContent != null &&
      String(row.translatedContent).trim()
    ) {
      map.set(String(row.id), String(row.translatedContent).trim());
    }
  }
  return map;
}
