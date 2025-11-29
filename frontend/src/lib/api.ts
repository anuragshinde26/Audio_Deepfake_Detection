// frontend/src/lib/api.ts

// Type returned by backend
export interface ApiResult {
  prediction?: string;
  confidence?: number;
  spectrogram_path?: string;
  spectrogram?: string; // base64 data URI
  file_name?: string;
  analysis_time?: number;
  spectral_heuristic?: number;
  probabilities?: {
    fake: number;
    real: number;
  };
}

/** Return base API URL (strip trailing slash if present) */
function getApiBase(): string {
  const env = (import.meta.env.VITE_API_URL as string) || "";
  if (env && env.length > 0) {
    return env.replace(/\/$/, "");
  }
  return "http://localhost:8000";
}

/** Try to parse a Response as JSON, otherwise return raw text */
async function parseJson(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* -----------------------------------------------------
   FILE UPLOAD → POST /predict
----------------------------------------------------- */
export async function analyzeFile(file: File): Promise<ApiResult> {
  const API_BASE = getApiBase();
  const url = `${API_BASE}/predict`;

  const form = new FormData();
  form.append("file", file);

  const resp = await fetch(url, {
    method: "POST",
    body: form,
  });

  if (!resp.ok) {
    const parsed = await parseJson(resp);
    const msg =
      parsed?.detail ||
      parsed?.message ||
      `Server error ${resp.status} ${resp.statusText}`;
    throw new Error(msg);
  }

  return (await resp.json()) as ApiResult;
}

/* -----------------------------------------------------
   URL ANALYSIS → POST /predict-url
   Primary: send FormData with field "youtube_url" (matches backend Form(...))
   Fallback: if server rejects form (422/415/400), try JSON { url: ... }
----------------------------------------------------- */
export async function analyzeUrl(urlValue: string): Promise<ApiResult> {
  const API_BASE = getApiBase();
  const endpoint = `${API_BASE}/predict-url`;

  // 1) Try FormData approach (backend with Form(...) expects field name "youtube_url")
  try {
    const form = new FormData();
    form.append("youtube_url", urlValue);

    const resp = await fetch(endpoint, {
      method: "POST",
      body: form,
    });

    if (resp.ok) {
      // success
      return (await resp.json()) as ApiResult;
    }

    // If server returned 415/422/400 try fallback below
    if (resp.status === 415 || resp.status === 422 || resp.status === 400) {
      // fallthrough to fallback
    } else {
      // for other errors parse message and throw
      const parsed = await parseJson(resp);
      const msg =
        parsed?.detail ||
        parsed?.message ||
        `Server returned ${resp.status} ${resp.statusText}`;
      throw new Error(msg);
    }
  } catch (err: any) {
    // If network error or other, we'll attempt fallback below.
    // But if it's a fatal error from fetch (CORS/network), rethrow to inform user.
    // If you prefer silent fallback on ANY error, comment out the following throw.
    // We'll *not* throw here so fallback JSON attempt runs.
  }

  // 2) Fallback: try JSON body { url: "<value>" }
  try {
    const resp2 = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ url: urlValue }),
    });

    if (!resp2.ok) {
      const parsed = await parseJson(resp2);
      const msg =
        parsed?.detail ||
        parsed?.message ||
        `Server error ${resp2.status} ${resp2.statusText}`;
      throw new Error(msg);
    }

    return (await resp2.json()) as ApiResult;
  } catch (err: any) {
    // If both attempts failed, provide a friendly aggregated error message
    const fallbackMsg =
      err?.message ||
      "Failed to contact the backend for URL analysis. Check backend logs and CORS settings.";
    throw new Error(
      `URL analysis failed (tried form-data and JSON). ${fallbackMsg}`
    );
  }
}
