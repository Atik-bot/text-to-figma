import { DesignSchema } from "./types";

const BACKEND_URL = "http://127.0.0.1:8000";

export async function generateDesign(prompt: string): Promise<DesignSchema> {
  let response: Response;

  try {
    response = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
  } catch {
    throw new Error(
      "Network error: could not reach the backend. Make sure the server is running on http://127.0.0.1:8000."
    );
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body.detail ?? JSON.stringify(body);
    } catch {
      detail = await response.text().catch(() => "");
    }
    throw new Error(
      `Server error ${response.status}: ${detail || response.statusText}`
    );
  }

  try {
    const data: DesignSchema = await response.json();
    return data;
  } catch {
    throw new Error(
      "Parse error: the server returned a response that is not valid JSON."
    );
  }
}
