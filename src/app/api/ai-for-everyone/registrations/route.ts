import { NextRequest, NextResponse } from "next/server";
import { redisCmd, verifyAdminToken, getAdminToken, Registration } from "@/lib/ai4all";
import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

async function verifyPaymentReceipt(
  imageUrl: string,
  expectedAmount: number
): Promise<{ isCorrect: boolean; reason: string }> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_API_KEY is not configured. Skipping auto-verification.");
    return { isCorrect: false, reason: "GOOGLE_API_KEY not configured on server" };
  }

  try {
    // 1. Fetch image
    const res = await fetch(imageUrl);
    if (!res.ok) {
      return { isCorrect: false, reason: `Failed to download screenshot: ${res.statusText}` };
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 2. Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    const prompt = `
You are an expert payment auditor. Your task is to look at the attached payment screenshot (UPI, GPay, PhonePe, Paytm, or bank transfer receipt) and verify if the payment was successful, paid to the correct details, and for the expected amount.

EXPECTED DETAILS:
- Recipient Name: "Sindhu Sudhakaran" (also accept variations like "Sindhu", "Sindhu Sudha", etc.)
- Recipient UPI ID: "sindhusudhakaransindhusudhakar-2@oksbi" (also accept matching phone "+91 9744616598" or "9744616598")
- Expected Amount: ₹${expectedAmount} (allow a match if the screenshot shows this exact numeric value as the paid/transferred amount)

Verify the following:
1. Is this actually a payment receipt/screenshot?
2. Is the transaction status successful or completed (not failed, pending, or declined)?
3. Does the transaction amount match the expected amount of ₹${expectedAmount}?
4. Does the recipient match Sindhu Sudhakaran, 9744616598, or the UPI ID "sindhusudhakaransindhusudhakar-2@oksbi"?

Return your response strictly in the following JSON format:
{
  "isPaymentReceipt": boolean,
  "isSuccessful": boolean,
  "recipientMatches": boolean,
  "amountMatches": boolean,
  "autoVerified": boolean,
  "reason": "A 1-sentence concise reason explaining what you found (e.g. 'Verified ₹50 payment to Sindhu Sudhakaran successfully' or 'Amount in receipt (₹100) does not match expected ₹50')"
}

Set "autoVerified" to true ONLY if:
- isPaymentReceipt is true
- isSuccessful is true
- recipientMatches is true
- amountMatches is true
`;

    let responseText = "";
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
          },
        });

        const content = [
          {
            inlineData: {
              mimeType: contentType,
              data: base64Data,
            },
          },
          { text: prompt },
        ];

        const result = await model.generateContent(content);
        responseText = result.response.text();
        if (responseText) break;
      } catch (err) {
        console.warn(`Model ${modelName} failed for OCR verification:`, err);
        lastError = err;
      }
    }

    if (!responseText) {
      throw lastError || new Error("All AI models failed to process payment receipt");
    }

    const verification = JSON.parse(responseText);
    return {
      isCorrect: !!verification.autoVerified,
      reason: verification.reason || (verification.autoVerified ? "Auto-verified successfully" : "Details did not match"),
    };

  } catch (error: any) {
    console.error("Auto-verification error:", error);
    return {
      isCorrect: false,
      reason: error.message || "Failed to parse receipt image",
    };
  }
}

// GET /api/ai-for-everyone/registrations  (admin — all registrations)
export async function GET(req: NextRequest) {
  if (!verifyAdminToken(getAdminToken(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const sessionIds: string[] = sessionId
    ? [sessionId]
    : ((await redisCmd(["LRANGE", "ai4all:sessions", "0", "-1"])) as string[]) ?? [];

  const all: Registration[] = [];
  for (const sid of sessionIds) {
    const ids = (await redisCmd(["LRANGE", `ai4all:registrations:${sid}`, "0", "-1"])) as string[] | null;
    if (!ids) continue;
    for (const id of ids) {
      const raw = await redisCmd(["GET", `ai4all:registration:${id}`]);
      if (raw) all.push(JSON.parse(raw as string));
    }
  }
  all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(all);
}

// POST /api/ai-for-everyone/registrations  (public)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.sessionId || !body.name || !body.phone || !body.whatsapp || !body.whyJoin) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check session exists and registration is open
    const rawSession = await redisCmd(["GET", `ai4all:session:${body.sessionId}`]);
    if (!rawSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    const session = JSON.parse(rawSession as string);
    if (!session.isRegistrationOpen) {
      return NextResponse.json({ error: "Registration is closed" }, { status: 403 });
    }

    let isScreenshotCorrect: boolean | undefined = undefined;
    let autoVerifiedReason: string | undefined = undefined;

    if (body.donationStatus === "donated" && body.screenshotUrl?.trim()) {
      try {
        const amount = body.donationAmount ?? 50;
        const ocrResult = await verifyPaymentReceipt(body.screenshotUrl.trim(), amount);
        if (ocrResult.isCorrect) {
          isScreenshotCorrect = true;
          autoVerifiedReason = `[Auto-Verified] ${ocrResult.reason}`;
        } else {
          autoVerifiedReason = `[Auto-Verification Failed] ${ocrResult.reason}`;
        }
      } catch (ocrError: any) {
        console.error("OCR auto-verification error:", ocrError);
        autoVerifiedReason = `[Auto-Verification Failed] ${ocrError.message || "Error running OCR validation"}`;
      }
    }

    const reg: Registration = {
      id: crypto.randomUUID(),
      sessionId: body.sessionId,
      name: body.name.trim(),
      phone: body.phone.trim(),
      whatsapp: body.whatsapp.trim(),
      district: body.district?.trim() || undefined,
      locationOther: (body.district === "Other State" || body.district === "Outside India") ? body.locationOther?.trim() : undefined,
      institution: body.institution?.trim() || undefined,
      whyJoin: body.whyJoin.trim(),
      donationStatus: body.donationStatus ?? "skipped",
      donationAmount: body.donationAmount,
      financialReason: body.financialReason?.trim(),
      screenshotUrl: body.screenshotUrl?.trim() || undefined,
      isScreenshotCorrect: isScreenshotCorrect,
      autoVerifiedReason: autoVerifiedReason,
      createdAt: new Date().toISOString(),
    };

    await redisCmd(["SET", `ai4all:registration:${reg.id}`, JSON.stringify(reg)]);
    await redisCmd(["RPUSH", `ai4all:registrations:${body.sessionId}`, reg.id]);
    return NextResponse.json({ id: reg.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
