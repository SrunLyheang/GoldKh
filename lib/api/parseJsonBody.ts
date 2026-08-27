import type { ZodType } from "zod";
import { apiError } from "./response";

type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: Response };

// Reads a JSON request body and validates it against `schema`. Returns a
// ready-made 400 on either a malformed body or a schema failure, so the
// mutating routes don't each re-implement the same try/catch. `label` names
// the payload in the schema-failure message ("Invalid <label>").
export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
  label = "request payload"
): Promise<ParseResult<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: apiError("INVALID_INPUT", "Request body must be valid JSON", 400),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: apiError("INVALID_INPUT", `Invalid ${label}`, 400),
    };
  }

  return { ok: true, data: parsed.data };
}
