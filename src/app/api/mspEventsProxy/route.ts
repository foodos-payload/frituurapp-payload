// File: src/app/api/mspEventsProxy/route.ts
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const eventsToken = searchParams.get("eventsToken");

    // Log incoming request details
    console.log("[Proxy] Received request:");
    console.log("Query Params:", searchParams.toString());
    console.log("eventsToken:", eventsToken);

    if (!eventsToken) {
        console.error("[Proxy] Missing eventsToken");
        return new Response("Missing eventsToken", { status: 400 });
    }

    const streamUrl = `https://api.multisafepay.com/events/stream/`;

    try {
        // Log the outgoing request details
        console.log("[Proxy] Forwarding request to MultiSafePay:");
        console.log("Stream URL:", streamUrl);
        console.log("Authorization Header:", `Bearer ${eventsToken}`);

        const response = await fetch(streamUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${eventsToken}`, // Include only the token
            },
        });

        // Log response status and headers from MultiSafePay
        console.log("[Proxy] Response from MultiSafePay:");
        console.log("Status:", response.status);
        console.log("Headers:", response.headers);

        if (!response.body) {
            console.error("[Proxy] No response body received from MultiSafePay");
            return new Response("Failed to connect to MultiSafePay", { status: 500 });
        }

        // Forward the response with appropriate headers
        console.log("[Proxy] Streaming response back to client.");
        return new Response(response.body, {
            status: response.status,
            headers: {
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": response.headers.get("Content-Type") || "application/json",
                "Access-Control-Allow-Origin": "*", // Allow any origin
                "Access-Control-Allow-Methods": "GET, OPTIONS",
            },
        });
    } catch (error) {
        // Log any errors during the fetch process
        console.error("[Proxy] Error connecting to MultiSafePay:", error);
        return new Response("Error connecting to MultiSafePay", { status: 500 });
    }
}
