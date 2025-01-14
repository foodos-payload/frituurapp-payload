// File: src/app/api/mspEventsProxy/route.ts

import { NextRequest } from "next/server";

/**
 * Connect to MSP SSE on the server side, forward SSE lines to the client via text/event-stream
 */
export async function GET(req: NextRequest) {
    // 1) Let's parse out "eventsToken" from the query
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

    // 2) Return a "readable" response => we must use the new Web Streams in Next 13
    //    We'll do a manual transform that calls MSP => "events/stream" and relays data.
    const eventsStreamUrl = "https://api.multisafepay.com/events/stream/";

    // Construct a ReadableStream we can write to
    const stream = new ReadableStream({
        async start(controller) {
            // We'll connect to MSP SSE from the server
            const fetchResp = await fetch(eventsStreamUrl, {
                method: "GET",
                headers: {
                    Authorization: eventsToken,
                    Accept: "text/event-stream",
                },
            });

            if (!fetchResp.ok || !fetchResp.body) {
                const errData = `event: error\ndata: {"error":"Failed to connect MSP SSE"}\n\n`;
                controller.enqueue(new TextEncoder().encode(errData));
                controller.close();
                return;
            }

            const reader = fetchResp.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    // MSP closed the stream => we close ours
                    controller.close();
                    break;
                }
                // Relay raw chunk
                if (value) {
                    controller.enqueue(value);
                }
            }
        },
    });

    // Return the new readable stream
    return new Response(stream, {
        status: 200,
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
