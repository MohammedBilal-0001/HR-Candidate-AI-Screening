"use node";

export class GeminiAuthError extends Error {}
export class GeminiRateLimitError extends Error {}
export class GeminiOtherError extends Error {}

export async function callGeminiJson(
  systemInstruction: string, userContent: string, responseSchema: object, apiKey: string,
  model: string = process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
): Promise<any> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema },
    }),
  });
  if (response.status === 401 || response.status === 403) throw new GeminiAuthError("Gemini rejected the API key.");
  if (response.status === 429) throw new GeminiRateLimitError("Gemini rate limit reached.");
  if (!response.ok) throw new GeminiOtherError(`Gemini request failed (${response.status}).`);
  const body = await response.json() as any;
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new GeminiOtherError("Gemini returned no JSON content.");
  try { return JSON.parse(text); } catch { throw new GeminiOtherError("Gemini returned invalid JSON."); }
}