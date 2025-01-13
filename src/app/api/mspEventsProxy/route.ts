// File: src/app/api/mspEventsProxy/route.ts
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const eventsToken = searchParams.get("eventsToken");

    if (!eventsToken) {
        return new Response("Missing eventsToken", { status: 400 });
    }

    const streamUrl = `https://api.multisafepay.com/events/stream/`;

    // Make the request to MultiSafePay with only the Authorization header
    const response = await fetch(streamUrl, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${eventsToken}`, // Include only the token
        },
    });

    if (!response.body) {
        return new Response("Failed to connect to MultiSafePay", { status: 500 });
    }

    // Return the response body as-is
    return new Response(response.body, {
        status: response.status,
        headers: {
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
