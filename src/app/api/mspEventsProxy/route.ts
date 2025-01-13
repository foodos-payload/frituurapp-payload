// File: src/app/api/mspEventsProxy/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const eventsToken = searchParams.get("eventsToken");

    if (!eventsToken) {
        return new Response(`event: error\ndata: {"error":"No eventsToken"}\n\n`, {
            status: 400,
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    }

    const eventsStreamUrl = `https://api.multisafepay.com/events/stream/?token=${eventsToken}`;

    const response = await fetch(eventsStreamUrl, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${eventsToken}`,
            Accept: "text/event-stream",
        },
    });

    if (!response.body) {
        return new Response(`event: error\ndata: {"error":"Failed to connect to MSP"}\n\n`, {
            status: 500,
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    }

    return new Response(response.body, {
        status: response.status,
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
