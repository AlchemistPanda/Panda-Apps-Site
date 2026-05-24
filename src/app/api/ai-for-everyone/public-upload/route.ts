import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// POST /api/ai-for-everyone/public-upload  (public — upload payment screenshot to Cloudinary)
export async function POST(req: NextRequest) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum 10MB allowed." }, { status: 400 });
    }

    // Generate Cloudinary signature for signed upload
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = "ai4all/screenshots";
    
    // Transformation: auto quality, auto format, resize to max 1200px wide
    const eager = "c_limit,w_1200,q_auto,f_auto";

    const paramsToSign = `eager=${eager}&folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign + apiSecret)
      .digest("hex");

    // Convert file to buffer for upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadForm = new FormData();
    uploadForm.append("file", new Blob([buffer], { type: file.type }), file.name);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", timestamp);
    uploadForm.append("signature", signature);
    uploadForm.append("folder", folder);
    uploadForm.append("eager", eager);

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: uploadForm }
    );

    if (!cloudRes.ok) {
      const errText = await cloudRes.text();
      return NextResponse.json(
        { error: `Cloudinary upload failed: ${errText}` },
        { status: 500 }
      );
    }

    const cloudData = await cloudRes.json();

    // Use the eager-transformed URL if available, else the original
    const optimizedUrl =
      cloudData.eager?.[0]?.secure_url || cloudData.secure_url;

    return NextResponse.json({
      url: optimizedUrl,
      originalUrl: cloudData.secure_url,
      width: cloudData.width,
      height: cloudData.height,
      bytes: cloudData.bytes,
      format: cloudData.format,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Upload failed" },
      { status: 500 }
    );
  }
}
