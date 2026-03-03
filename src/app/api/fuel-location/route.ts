import { type NextRequest } from "next/server";

// IP-based geolocation — only returns state + city name.
// No personal data is stored or forwarded beyond the IP → geo lookup.
export async function GET(req: NextRequest) {
  try {
    // Get the real client IP from Vercel/proxy headers
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : null;

    // Localhost / private IP → return Kerala as default
    if (
      !ip ||
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.")
    ) {
      return Response.json({ state: "Kerala", city: "Ernakulam", method: "default" });
    }

    // Free IP geolocation (no API key needed, no personal data in response)
    const geo = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city`,
      { cache: "no-store" }
    ).then((r) => r.json());

    if (geo.status !== "success" || geo.country !== "India") {
      // IP not in India — default to Kerala
      return Response.json({ state: "Kerala", city: "Ernakulam", method: "default" });
    }

    // Return ONLY state + city — nothing about the IP itself
    return Response.json({
      state: geo.regionName as string,
      city: geo.city as string,
      method: "ip",
    });
  } catch {
    return Response.json({ state: "Kerala", city: "Ernakulam", method: "default" });
  }
}
