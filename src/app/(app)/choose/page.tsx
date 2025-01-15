// File: /src/app/(app)/choose/page.tsx

import React from "react";
import { headers } from "next/headers";
import { KioskContainer } from "./components/kiosk/KioskContainer";
import { ChooseMode } from "./ChooseMode";

export default async function IndexPage() {
    // 1) Get host info from request headers
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // 2) Fetch fulfillment options
    const fulfillmentUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getFulFillment?host=${hostSlug}`;
    const fulfillmentRes = await fetch(fulfillmentUrl, { cache: "no-store" });

    let fulfillmentOptions: any[] = [];
    if (fulfillmentRes.ok) {
        const data = await fulfillmentRes.json();
        fulfillmentOptions = Array.isArray(data)
            ? data.map((item: any) => {
                const { method_type, id } = item;
                switch (method_type) {
                    case "dine_in":
                        return { key: "dine-in", label: "Dine In", methodId: id };
                    case "takeaway":
                        return { key: "takeaway", label: "Takeaway", methodId: id };
                    case "delivery":
                        return { key: "delivery", label: "Delivery", methodId: id };
                    default:
                        return { key: method_type, label: method_type, methodId: id };
                }
            })
            : [];
    }

    // 3) Render, passing data to your client components
    return (
        <ChooseMode
            shopSlug={hostSlug}
            fulfillmentOptions={fulfillmentOptions}
        />
    );
}
