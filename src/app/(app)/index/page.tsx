// File: /src/app/(app)/index/page.tsx
import React from "react";
import { headers } from "next/headers";
import { KioskContainer } from "./components/kiosk/KioskContainer";
import { ChooseMode } from "./ChooseMode";

export const dynamic = "force-dynamic";

export default async function IndexPage(context: any) {
    // 1) Get searchParams from context
    const searchParams = context?.searchParams || {};
    const kioskParam = searchParams.kiosk; // "true" or undefined

    // 2) Wait for request headers
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // 3) Check if kiosk mode is on
    const isKiosk = kioskParam === "true";

    // 4) Build + fetch fulfillment
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

    // 5) If kiosk => remove delivery
    if (isKiosk) {
        fulfillmentOptions = fulfillmentOptions.filter(
            (option) => option.key !== "delivery"
        );
    }

    // 6) If kiosk => fetch branding
    let brandingData: any = {};
    if (isKiosk) {
        const brandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`;
        const brandingRes = await fetch(brandingUrl, { cache: "no-store" });
        if (brandingRes.ok) {
            const brandingJSON = await brandingRes.json();
            if (brandingJSON?.branding) {
                brandingData = {
                    siteTitle: brandingJSON.branding.siteTitle ?? "My Kiosk Site",
                    siteHeaderImg:
                        brandingJSON.branding.siteHeaderImg?.s3_url || "/images/defaultHeader.jpg",
                    logoUrl:
                        brandingJSON.branding.siteLogo?.s3_url ||
                        "https://cdn.prod.website-files.com/66d08c0e87acbd0c4e0d69ec/66d08cd5a1d7c9b3d199da28_Frituurapp-Logo-p-500.png",
                    primaryColorCTA: brandingJSON.branding.primaryColorCTA ?? null,
                    headerBackgroundColor:
                        brandingJSON.branding.headerBackgroundColor ?? "#ffffff",
                };
            }
        }
    }

    // 7) Render kiosk or normal
    if (isKiosk) {
        return (
            <KioskContainer
                shopSlug={hostSlug}
                fulfillmentOptions={fulfillmentOptions}
                branding={brandingData}
            />
        );
    }

    return <ChooseMode shopSlug={hostSlug} fulfillmentOptions={fulfillmentOptions} />;
}
