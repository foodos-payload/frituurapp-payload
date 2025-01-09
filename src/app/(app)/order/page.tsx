// File: /app/(app)/order/page.tsx
import React from "react";
import { headers } from "next/headers";
import OrderLayout from "./components/OrderLayout";

export default async function OrderPage() {
    // 1) Wait for request headers (because you need them)
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // 2) Build API endpoints
    const apiProductsUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getProducts?host=${hostSlug}`;

    // 3) Fetch data in parallel
    const [productsRes] = await Promise.all([
        fetch(apiProductsUrl, { cache: "no-store" }),
    ]);

    if (!productsRes.ok) {
        console.error(
            `[OrderPage] Could not load products for host: ${hostSlug} – status ${productsRes.status}`
        );
        return (
            <div style={{ padding: "1rem" }}>
                <h2>Could not load products for host: {hostSlug}</h2>
            </div>
        );
    }

    // 4) Parse the JSON
    const productsData = await productsRes.json();
    const categorizedProducts = productsData?.categorizedProducts || [];

    // ADD YOUR CONSOLE LOGS HERE
    // console.log(`[OrderPage] raw productsData:`, productsData);
    // console.log(`[OrderPage] categorizedProducts:`, categorizedProducts);

    // Sort categories
    categorizedProducts.sort((a: any, b: any) => {
        if (a.menuOrder !== b.menuOrder) {
            return a.menuOrder - b.menuOrder;
        }
        return a.name_nl.localeCompare(b.name_nl);
    });

    // 5) Render layout
    return (
        <OrderLayout
            shopSlug={hostSlug}
            categorizedProducts={categorizedProducts}
        />
    );
}
