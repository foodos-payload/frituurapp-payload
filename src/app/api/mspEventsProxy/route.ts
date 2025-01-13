// File: src/app/api/mspEventsProxy/route.ts
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const eventsToken = searchParams.get("eventsToken");

    if (!eventsToken) {
        return new Response("Missing eventsToken", { status: 400 });
    }

    const streamUrl = `https://api.multisafepay.com/events/stream/?token=${encodeURIComponent(eventsToken)}`;

    const response = await fetch(streamUrl, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${eventsToken}`,
        },
    });

    if (!response.body) {
        return new Response("Failed to connect to MultiSafePay", { status: 500 });
    }

    return new Response(response.body, {
        status: response.status,
        headers: {
            "Content-Type": response.headers.get("Content-Type") || "application/json",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });

}
