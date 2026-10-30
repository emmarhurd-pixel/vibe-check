import { GoogleGenAI, ThinkingLevel, type Schema } from "@google/genai";

const GROQ_MODEL = "openai/gpt-oss-120b";
const GEMINI_MODEL = "gemini-3.8-flash";
const TIME_LIMIT_MS = 20000;

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type Schemas = {
  name: string;
  groq: object;
  gemini: Schema;
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`AI took longer than ${ms / 1000} seconds`)), ms)
    ),
  ]);
}

async function askGroq(prompt: string, schemas: Schemas): Promise<unknown> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      reasoning_effort: "low",
      response_format: {
        type: "json_schema",
        json_schema: { name: schemas.name, strict: true, schema: schemas.groq },
      },
    }),
    signal: AbortSignal.timeout(TIME_LIMIT_MS),
  });

  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

async function askGemini(prompt: string, schemas: Schemas): Promise<unknown> {
  const response = await withTimeout(
    gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schemas.gemini,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    }),
    TIME_LIMIT_MS
  );
  return JSON.parse(response.text ?? "");
}

export async function askAI<T>(
  prompt: string,
  schemas: Schemas,
  validate: (data: unknown) => T
): Promise<T> {
  const services: { name: string; ask: (prompt: string, schemas: Schemas) => Promise<unknown> }[] = [];
  if (process.env.GROQ_API_KEY) services.push({ name: "Groq", ask: askGroq });
  if (process.env.GEMINI_API_KEY) services.push({ name: "Gemini", ask: askGemini });

  let lastError: unknown = new Error("No AI service is set up");

  for (const service of services) {
    try {
      const started = Date.now();
      const result = validate(await service.ask(prompt, schemas));
      console.log(`${schemas.name} from ${service.name} in ${((Date.now() - started) / 1000).toFixed(1)}s`);
      return result;
    } catch (error) {
      console.error(`${service.name} failed:`, error);
      lastError = error;
    }
  }

  throw lastError;
}