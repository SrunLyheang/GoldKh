import { z } from "zod";

export const GOLDAPI_SOURCE = "goldapi.io";

const GOLDAPI_URL = "https://www.goldapi.io/api/XAU/USD";

const responseSchema = z.object({
  price: z.number().positive(),
});

export interface NormalizedPrice {
  pricePerTroyOz: string;
  source: string;
}

// A provider returning HTTP 200 with an error body is the expected
// failure mode to guard against, not an edge case. The schema parse
// below rejects that shape the same way it rejects a network error, so
// callers only need one try/catch.
export async function fetchGoldapiPrice(): Promise<NormalizedPrice> {
  const apiKey = process.env.GOLDAPI_IO_API_KEY;
  if (!apiKey) {
    throw new Error("GOLDAPI_IO_API_KEY is not set");
  }

  const res = await fetch(GOLDAPI_URL, {
    headers: {
      "x-access-token": apiKey,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`goldapi.io responded with status ${res.status}`);
  }

  const body: unknown = await res.json();
  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error("goldapi.io response failed validation");
  }

  return {
    pricePerTroyOz: parsed.data.price.toFixed(4),
    source: GOLDAPI_SOURCE,
  };
}
