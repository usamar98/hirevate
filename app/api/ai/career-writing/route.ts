import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, getProfile, isPaidSubscription } from "@/lib/auth/session";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const compactText = (max: number) => z.string().trim().max(max).default("");

const requestSchema = z.discriminatedUnion("task", [
  z.object({
    task: z.literal("resume_summary"),
    context: z.object({
      headline: compactText(180),
      targetRole: compactText(180),
      targetKeywords: compactText(1500),
      currentSummary: compactText(2400),
      skills: compactText(2000),
      experience: compactText(5000)
    })
  }),
  z.object({
    task: z.literal("resume_bullets"),
    context: z.object({
      role: compactText(180),
      company: compactText(180),
      targetRole: compactText(180),
      targetKeywords: compactText(1500),
      bullets: z.array(z.string().trim().max(800)).min(1).max(8)
    })
  }),
  z.object({
    task: z.literal("cover_letter"),
    context: z.object({
      fullName: compactText(180),
      role: compactText(180),
      company: compactText(180),
      tone: z.enum(["focused", "warm", "executive"]),
      experience: compactText(3500),
      skills: compactText(2000),
      achievements: compactText(3000),
      jobDescription: compactText(7000)
    })
  })
]);

type RateState = {
  count: number;
  resetAt: number;
};

const rateLimitByUser = new Map<string, RateState>();
const rateLimitWindowMs = 60 * 60 * 1000;
const maxRequestsPerWindow = 20;

function hasRateLimitCapacity(userId: string) {
  const now = Date.now();
  const current = rateLimitByUser.get(userId);

  if (!current || current.resetAt <= now) {
    rateLimitByUser.set(userId, { count: 1, resetAt: now + rateLimitWindowMs });
    return true;
  }

  if (current.count >= maxRequestsPerWindow) {
    return false;
  }

  current.count += 1;
  return true;
}

function getStructuredOutput(task: z.infer<typeof requestSchema>["task"]) {
  if (task === "resume_bullets") {
    return {
      name: "resume_bullets",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          bullets: {
            type: "array",
            minItems: 1,
            maxItems: 6,
            items: { type: "string" }
          }
        },
        required: ["bullets"]
      }
    };
  }

  return {
    name: task === "cover_letter" ? "cover_letter" : "resume_summary",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        text: { type: "string" }
      },
      required: ["text"]
    }
  };
}

function extractResponseText(payload: unknown) {
  const response = payload as {
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text" && typeof item.text === "string")
      ?.text ?? null
  );
}

function buildInstructions(task: z.infer<typeof requestSchema>["task"]) {
  const shared =
    "You are a senior career editor. Use only facts supplied by the user. Never invent employers, skills, metrics, credentials, responsibilities, or outcomes. Preserve every supplied number exactly. Write naturally, avoid cliches and keyword stuffing, and return only the requested JSON.";

  if (task === "resume_summary") {
    return shared + " Write a concise ATS-friendly professional summary of 45 to 75 words tailored to the target role.";
  }

  if (task === "resume_bullets") {
    return shared + " Rewrite the supplied bullets as concise accomplishment bullets. Start with varied action verbs, preserve facts, and return 3 to 6 bullets.";
  }

  return shared + " Write a specific cover letter of 250 to 380 words. Use short paragraphs, connect evidence to the role, and do not claim knowledge about the company that was not supplied.";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Log in to use AI writing." }, { status: 401 });
  }

  const profile = await getProfile(user.id);
  if (!isPaidSubscription(profile?.subscription_status)) {
    return NextResponse.json({ error: "AI writing is included with paid Hirevate plans." }, { status: 403 });
  }

  if (!env.openAiApiKey) {
    return NextResponse.json(
      { error: "AI writing is temporarily unavailable." },
      { status: 503 }
    );
  }

  if (!hasRateLimitCapacity(user.id)) {
    return NextResponse.json(
      { error: "AI writing limit reached. Try again later." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the writing inputs and try again." }, { status: 400 });
  }

  const output = getStructuredOutput(parsed.data.task);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.openAiApiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: env.openAiModel,
        store: false,
        instructions: buildInstructions(parsed.data.task),
        input: JSON.stringify(parsed.data.context),
        max_output_tokens: parsed.data.task === "cover_letter" ? 1200 : 700,
        text: {
          format: {
            type: "json_schema",
            name: output.name,
            strict: true,
            schema: output.schema
          }
        }
      }),
      signal: AbortSignal.timeout(30_000)
    });

    if (!response.ok) {
      console.error("AI writing provider failed", {
        status: response.status,
        task: parsed.data.task
      });
      return NextResponse.json(
        { error: "AI writing could not finish right now. Try again shortly." },
        { status: 502 }
      );
    }

    const responsePayload = (await response.json()) as unknown;
    const responseText = extractResponseText(responsePayload);
    if (!responseText) {
      return NextResponse.json(
        { error: "AI writing returned an empty result. Try again." },
        { status: 502 }
      );
    }

    const result = JSON.parse(responseText) as unknown;
    const resultSchema =
      parsed.data.task === "resume_bullets"
        ? z.object({ bullets: z.array(z.string().trim().min(1).max(800)).min(1).max(6) })
        : z.object({ text: z.string().trim().min(1).max(8000) });
    const validated = resultSchema.safeParse(result);

    if (!validated.success) {
      return NextResponse.json(
        { error: "AI writing returned an invalid result. Try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { result: validated.data },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("AI writing request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      task: parsed.data.task
    });
    return NextResponse.json(
      { error: "AI writing could not finish right now. Try again shortly." },
      { status: 502 }
    );
  }
}
