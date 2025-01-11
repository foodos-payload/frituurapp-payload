// File: /src/app/(app)/order-summary/OrderSummaryPage.client.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/utilities/fetcher";
import { FiChevronRight } from "react-icons/fi";
import { CountdownTimer } from "./CountdownTimer";
import "./ordersummary.css";
import { useShopBranding } from "@/context/ShopBrandingContext";
import { useTranslation } from "@/context/TranslationsContext";

/** 
 * HELPER TYPES 
 */
type OrderStatus =
    | "pending_payment"
    | "awaiting_preparation"
    | "in_preparation"
    | "complete"
    | "cancelled"
    | "in_delivery"
    | "ready_for_pickup";

type FulfillmentMethod = "delivery" | "takeaway" | "dine_in" | "unknown";

/** 
 * Subproduct (may have quantity)
 */
interface Subproduct {
    id: string;
    subproductId: string;
    name_nl?: string;
    name_en?: string;
    name_de?: string;
    name_fr?: string;
    price?: number;
    tax?: number;
    tax_dinein?: number;
    quantity?: number; // new
}

/** 
 * Payment info
 */
interface Payment {
    id: string;
    payment_method: { id: string; provider?: string };
    amount: number;
}

/** 
 * A single line item
 */
interface OrderDetail {
    id: string;
    product: {
        id: string;
        name_nl?: string;
        name_en?: string;
        name_de?: string;
        name_fr?: string;
    };
    name_nl?: string;
    name_en?: string;
    name_de?: string;
    name_fr?: string;
    quantity: number;
    price?: number;
    tax?: number;
    subproducts?: Subproduct[];
}

/** 
 * Customer info
 */
interface CustomerDetails {
    firstName?: string;
    lastName?: string;
    // ...
}

/** 
 * Promotions used
 */
interface PromotionsUsed {
    pointsUsed?: number;
    creditsUsed?: number;
    couponUsed?: {
        couponId?: string;
        barcode?: string;
        value?: number;
        value_type?: "fixed" | "percentage";
        valid_from?: string;
        valid_until?: string;
        max_uses?: number;
        used?: boolean;
    };
    giftVoucherUsed?: {
        voucherId?: string;
        barcode?: string;
        value?: number;
        valid_from?: string;
        valid_until?: string;
        used?: boolean;
    };
}

/** 
 * The full order object
 */
interface Order {
    id: number;
    tempOrdNr?: number;
    status: OrderStatus;
    fulfillmentMethod?: FulfillmentMethod;
    date_created?: string;
    customer_note?: string;
    order_details?: OrderDetail[];
    payments?: Payment[];
    total?: number;
    shipping_cost?: number;
    fulfillment_time?: string;
    fulfillment_date?: string;
    fulfillment_method?: string;
    customer_details?: CustomerDetails;
    discountTotal?: number;
    promotionsUsed?: PromotionsUsed;
    // etc...
}

/** 
 * Props
 */
interface OrderSummaryPageProps {
    orderId: string;
    kioskMode?: boolean;
    hostSlug: string;
    fulfillments?: any[];
}

/** 
 * Helper: pick localized name for a detail
 */
function pickDetailName(detail: OrderDetail, locale: string) {
    switch (locale) {
        case "en":
            return (
                detail.name_en ??
                detail.product.name_en ??
                detail.product.name_nl ??
                "Unnamed Product"
            );
        case "de":
            return (
                detail.name_de ??
                detail.product.name_de ??
                detail.product.name_nl ??
                "Unnamed Product"
            );
        case "fr":
            return (
                detail.name_fr ??
                detail.product.name_fr ??
                detail.product.name_nl ??
                "Unnamed Product"
            );
        default:
            // "nl" fallback
            return (
                detail.name_nl ??
                detail.product.name_nl ??
                "Unnamed Product"
            );
    }
}

/** 
 * Helper: pick localized subproduct name
 */
function pickSubproductName(sp: Subproduct, locale: string) {
    switch (locale) {
        case "en":
            return sp.name_en ?? sp.name_nl ?? "Unnamed Subproduct";
        case "de":
            return sp.name_de ?? sp.name_nl ?? "Unnamed Subproduct";
        case "fr":
            return sp.name_fr ?? sp.name_nl ?? "Unnamed Subproduct";
        default:
            return sp.name_nl ?? "Unnamed Subproduct";
    }
}

/** 
 * A small helper to show subproduct line: e.g. "Fanta x2 (+€3.00)"
 */
function getSubLineDisplay(sp: Subproduct, locale: string): string {
    const spQty = sp.quantity ?? 1;
    const spTotal = (sp.price ?? 0) * spQty;
    const spName = pickSubproductName(sp, locale);
    const qtySuffix = spQty > 1 ? ` x${spQty}` : "";
    return `${spName}${qtySuffix} (+€${spTotal.toFixed(2)})`;
}

/** 
 * The main client-side page component
 */
export function OrderSummaryPage({
    orderId,
    kioskMode,
    hostSlug,
    fulfillments,
}: OrderSummaryPageProps) {
    const { locale } = useTranslation();
    const router = useRouter();

    // Grab branding
    const branding = useShopBranding();
    const brandCTA = branding?.primaryColorCTA || "#068b59"; // fallback bluish

    // Local state
    const [userLocale, setUserLocale] = useState("nl");
    useEffect(() => {
        const storedLocale = localStorage.getItem("userLocale") || "nl";
        setUserLocale(storedLocale);
    }, []);

    // Kiosk countdown
    const [countdown, setCountdown] = useState(30);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    // Confetti previous status check
    const previousStatusRef = useRef<OrderStatus | null>(null);

    // Loading state for the "Create New Order" button spinner
    const [createNewOrderLoading, setCreateNewOrderLoading] = useState(false);

    // SWR fetch
    const { data: order, error, isLoading } = useSWR<Order>(
        `/api/orders?host=${encodeURIComponent(hostSlug)}&orderId=${encodeURIComponent(orderId)}`,
        fetcher,
        { refreshInterval: 5000 }
    );

    /** Trigger confetti if order becomes "complete" **/
    const triggerConfetti = useCallback(() => {
        const duration = 5000; // ms
        const animationEnd = Date.now() + duration;
        const defaults = { spread: 70, origin: { y: 0.6 } };

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                clearInterval(interval);
                return;
            }
            confetti({
                ...defaults,
                particleCount: 200,
                origin: { x: 0.1, y: 0.6 },
            });
            confetti({
                ...defaults,
                particleCount: 200,
                origin: { x: 0.9, y: 0.6 },
            });
        }, 500);
    }, []);

    // Listen for status change => confetti
    useEffect(() => {
        if (!order) return;
        const prevStatus = previousStatusRef.current;
        if (prevStatus !== "complete" && order.status === "complete") {
            triggerConfetti();
        }
        previousStatusRef.current = order.status;
    }, [order, triggerConfetti]);

    // Kiosk => countdown => auto navigate away
    useEffect(() => {
        if (!kioskMode) return;
        const timeout = setTimeout(() => {
            countdownRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(countdownRef.current!);
                        handleCreateNewOrderClick();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, 2000);

        return () => {
            clearTimeout(timeout);
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
        };
    }, [kioskMode]);

    // "Create New Order" => clear localstorage + navigate
    const handleCreateNewOrderClick = useCallback(() => {
        if (createNewOrderLoading) return; // avoid double click
        setCreateNewOrderLoading(true);

        // Clear local storage
        localStorage.removeItem("selectedShippingMethod");
        localStorage.removeItem("selectedPaymentId");
        localStorage.removeItem("shippingCost");

        // We'll never reset createNewOrderLoading to false, 
        // because we navigate away and won't come back
        if (kioskMode) {
            router.push(`/index?kiosk=true`);
        } else {
            router.push(`/index`);
        }
    }, [kioskMode, router, createNewOrderLoading]);

    // If error
    if (error) {
        return (
            <div className="text-center p-8 text-red-500">
                <h2 className="text-2xl font-bold mb-2">Error</h2>
                <p>{error.message || "Could not fetch order."}</p>
            </div>
        );
    }

    // If loading
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <p className="text-2xl font-semibold">Loading order summary...</p>
            </div>
        );
    }

    // If no order
    if (!order) {
        return (
            <div className="text-center p-8 text-gray-500">
                <p>No order data.</p>
            </div>
        );
    }

    // Summaries, instructions, etc.
    const displayedOrderNumber = order.tempOrdNr ?? order.id;
    const shippingCost = order.shipping_cost ?? 0;
    const totalPaid = order.total ?? 0;

    // Possibly fetch instructions from fulfillments
    let fulfillmentInstructions = "";
    if (fulfillments && Array.isArray(fulfillments)) {
        const matched = fulfillments.find((f) => f.method_type === order.fulfillment_method);
        if (matched && matched.settings) {
            if (kioskMode) {
                fulfillmentInstructions = matched.settings.kiosk_pickup_instructions || "";
            } else {
                fulfillmentInstructions = matched.settings.pickup_instructions || "";
            }
        }
    }
    if (fulfillmentInstructions && order.customer_details?.firstName) {
        fulfillmentInstructions = `Hi ${order.customer_details.firstName}, ${fulfillmentInstructions}`;
    }

    // Status flow
    function getStatusFlow(method: FulfillmentMethod): OrderStatus[] {
        switch (method) {
            case "delivery":
                return ["awaiting_preparation", "in_preparation", "in_delivery", "complete"];
            case "takeaway":
                return ["awaiting_preparation", "in_preparation", "ready_for_pickup", "complete"];
            case "dine_in":
                return ["awaiting_preparation", "in_preparation", "complete"];
            default:
                return ["awaiting_preparation", "in_preparation", "complete"];
        }
    }

    // Determine label + color for each status
    function getStatusColorAndLabel(status: string) {
        let label = status;
        let colorClasses = "bg-gray-100 text-gray-700"; // fallback

        switch (status) {
            case "awaiting_preparation":
                label = "Awaiting Prep";
                colorClasses = "bg-orange-100 text-orange-800";
                break;
            case "in_preparation":
                label = "In Prep";
                colorClasses = "bg-blue-100 text-blue-800";
                break;
            case "ready_for_pickup":
                label = "Ready for Pickup";
                colorClasses = "bg-purple-100 text-purple-800";
                break;
            case "in_delivery":
                label = "In Delivery";
                colorClasses = "bg-purple-100 text-purple-800";
                break;
            case "complete":
                label = "Completed";
                colorClasses = "bg-green-200 text-green-800";
                break;
            case "cancelled":
                label = "Cancelled";
                colorClasses = "bg-red-100 text-red-800";
                break;
            default:
                // fallback
                break;
        }
        return { label, colorClasses };
    }

    // For pulses
    function extractTextColorClass(colorClasses: string): string {
        const match = colorClasses.match(/(text-[a-z]+-\d{3})/);
        return match?.[1] || "text-gray-700";
    }

    const flow = getStatusFlow((order.fulfillment_method as FulfillmentMethod) ?? "unknown");
    const orderDetails = order.order_details ?? [];

    /**
     * RENDER
     */
    if (kioskMode) {
        // KIOSK UI
        return (
            <div className="relative w-full min-h-[600px] flex flex-col items-center justify-center text-4xl p-6">
                <div className="w-full max-w-3xl shadow-md rounded-xl overflow-hidden relative flex flex-col justify-center">
                    {/* Top color bar */}
                    <div
                        className="p-4 text-white flex items-center justify-between"
                        style={{ backgroundColor: branding?.headerBackgroundColor || "#dc2626" }}
                    >
                        {/* Branding Logo if any */}
                        {branding?.logoUrl && (
                            <img
                                src={branding.logoUrl}
                                alt="Site Logo"
                                className="mr-2 max-h-40 w-auto object-contain"
                            />
                        )}
                        {/* Order ID/time */}
                        <div className="font-bold text-lg uppercase tracking-wider">
                            <div className="text-4xl font-semibold mb-1">
                                Order #{displayedOrderNumber}
                            </div>
                            <div className="text-white-500 text-xl">
                                {order.fulfillment_time || "No time"}{" "}
                                {order.fulfillment_date
                                    ? new Date(order.fulfillment_date).toLocaleDateString()
                                    : ""}
                            </div>
                        </div>
                    </div>

                    {/* Single big status badge */}
                    <div className="flex items-center justify-center">
                        <div className="mb-16 mt-16 text-center flex">
                            {(() => {
                                const { label, colorClasses } = getStatusColorAndLabel(order.status);
                                const textTailwindClass = extractTextColorClass(colorClasses);
                                const colorMap: Record<string, string> = {
                                    "text-blue-800": "rgba(59,130,246,0.7)",
                                    "text-orange-800": "rgba(217,119,6,0.7)",
                                };
                                const pulseColor = colorMap[textTailwindClass] ?? "rgba(59,130,246,0.7)";
                                const activeStyles = {
                                    border: "2px solid currentColor",
                                    "--pulse-color": pulseColor,
                                };
                                return (
                                    <div
                                        className={`
                      ${colorClasses}
                      px-6 py-3
                      rounded-full
                      text-4xl
                      animate-pulse-border
                    `}
                                        style={activeStyles as React.CSSProperties}
                                    >
                                        {label}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* instructions */}
                    {fulfillmentInstructions && (
                        <div className="text-center text-2xl max-w-3xl bg-gray-100 text-gray-800 p-6 rounded-lg shadow-lg font-semibold">
                            {fulfillmentInstructions}
                        </div>
                    )}

                    {/* dashed line */}
                    <div className="relative">
                        <svg
                            className="text-gray-400 mx-auto"
                            width="100%"
                            height="20"
                            preserveAspectRatio="none"
                        >
                            <line
                                x1="0"
                                y1="10"
                                x2="100%"
                                y2="10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeDasharray="6,6"
                            />
                        </svg>
                    </div>

                    {/* Order details */}
                    <div className="flex-1 overflow-y-auto pt-1 pb-0">
                        {orderDetails.length < 1 ? (
                            <p className="text-gray-500 text-sm p-3">No products in order.</p>
                        ) : (
                            <div className="space-y-3 p-3">
                                {orderDetails.map((detail) => {
                                    const itemName = pickDetailName(detail, userLocale);

                                    // sub line total
                                    const subLineTotal =
                                        detail.subproducts?.reduce(
                                            (acc, sp) => acc + (sp.price ?? 0) * (sp.quantity ?? 1),
                                            0
                                        ) ?? 0;
                                    // full line total => (price + subLineTotal) * quantity
                                    const finalLineTotal =
                                        ((detail.price ?? 0) + subLineTotal) * detail.quantity;

                                    return (
                                        <div
                                            key={detail.id}
                                            className="bg-white shadow-sm p-3 rounded text-xl"
                                        >
                                            {/* row => quantity left, name+price right */}
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-gray-600">x {detail.quantity}</div>
                                                <div className="flex-1 ml-3 flex justify-between">
                                                    <div className="font-semibold">{itemName}</div>
                                                    <div className="ml-4 text-gray-500">
                                                        €{finalLineTotal.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* subproducts */}
                                            {(detail.subproducts ?? []).length > 0 && (
                                                <ul className="ml-4 list-disc list-inside mt-1 text-gray-500">
                                                    {detail.subproducts?.map((sp) => {
                                                        const subLine = getSubLineDisplay(sp, userLocale);
                                                        return (
                                                            <li key={sp.id} className="flex justify-between">
                                                                <span>{subLine}</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* If discount => show discount line (only if discountTotal > 0) */}
                        {(order.discountTotal ?? 0) > 0 && (
                            <div className="flex items-center justify-end p-3 pt-3 text-red-600">
                                <span className="text-2xl font-semibold">
                                    Discount: -€{(order.discountTotal ?? 0).toFixed(2)}
                                </span>
                            </div>
                        )}

                        {/* If promotionsUsed => extra lines, skip if 0 */}
                        {order.promotionsUsed && (
                            <div className="px-3 text-lg text-gray-600 space-y-1">

                                {/* Points */}
                                {order.promotionsUsed.pointsUsed && order.promotionsUsed.pointsUsed > 0 && (
                                    <div>
                                        Membership Points: -€
                                        {order.promotionsUsed.pointsUsed > 0
                                            ? ((order.promotionsUsed.pointsUsed ?? 0) * 0.01).toFixed(2)
                                            : ""}
                                    </div>
                                )}

                                {/* Credits */}
                                {order.promotionsUsed.creditsUsed && order.promotionsUsed.creditsUsed > 0 && (
                                    <div>
                                        Store Credits: -€
                                        {order.promotionsUsed.creditsUsed > 0
                                            ? (order.promotionsUsed.creditsUsed ?? 0).toFixed(2)
                                            : ""}
                                    </div>
                                )}

                                {/* Coupon */}
                                {order.promotionsUsed.couponUsed?.barcode && (
                                    <div>
                                        Coupon: {order.promotionsUsed.couponUsed.barcode}
                                        {order.promotionsUsed.couponUsed.value_type === "fixed"
                                            ? ` => -€${(order.promotionsUsed.couponUsed.value ?? 0) > 0
                                                ? order.promotionsUsed.couponUsed.value
                                                : ""
                                            }`
                                            : ` => -${(order.promotionsUsed.couponUsed.value ?? 0) > 0
                                                ? order.promotionsUsed.couponUsed.value
                                                : ""
                                            }%`}
                                    </div>
                                )}

                                {/* Gift Voucher */}
                                {order.promotionsUsed.giftVoucherUsed?.barcode &&
                                    (order.promotionsUsed.giftVoucherUsed.value ?? 0) > 0 && (
                                        <div>
                                            Gift Voucher: {order.promotionsUsed.giftVoucherUsed.barcode} =&gt; -€
                                            {(order.promotionsUsed.giftVoucherUsed.value ?? 0) > 0
                                                ? (order.promotionsUsed.giftVoucherUsed.value ?? 0).toFixed(2)
                                                : ""}
                                        </div>
                                    )}
                            </div>
                        )}


                        {/* shipping cost if any */}
                        {shippingCost > 0 && (
                            <div className="flex items-center justify-end p-3 pt-3">
                                <span className="text-2xl font-semibold">
                                    Shipping: €{shippingCost.toFixed(2)}
                                </span>
                            </div>
                        )}

                        {/* Final total */}
                        <div className="flex items-center justify-end p-3 pt-3">
                            <span className="text-3xl font-bold">
                                €{totalPaid.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Big kiosk button => countdown */}
                    <button
                        id="newOrderButton"
                        onClick={handleCreateNewOrderClick}
                        className="bg-green-600 text-white px-8 py-4 mt-12 rounded text-4xl"
                        style={{ backgroundColor: brandCTA }}
                    >
                        {createNewOrderLoading ? (
                            // spinner
                            <svg
                                width="36"
                                height="36"
                                viewBox="0 0 24 24"
                                className="mx-auto animate-spin"
                                strokeWidth="3"
                                fill="none"
                                stroke="currentColor"
                            >
                                <circle cx="12" cy="12" r="10" className="opacity-20" />
                                <path d="M12 2 A10 10 0 0 1 22 12" className="opacity-75" />
                            </svg>
                        ) : (
                            `Create New Order (${countdown}s)`
                        )}
                    </button>
                </div>
            </div>
        );
    } else {
        // NON-KIOSK UI
        const flow = getStatusFlow(
            (order.fulfillment_method as FulfillmentMethod) ?? "unknown"
        );
        const orderDetails = order.order_details ?? [];

        return (
            <div className="relative w-full min-h-[600px] flex flex-col items-center justify-center text-base p-0 sm:p-8 text-gray-800">
                <div className="w-full max-w-xl bg-white shadow-lg rounded-xl overflow-hidden relative flex flex-col min-h-[550px]">
                    {/* Top color bar */}
                    <div
                        className="p-4 text-white flex items-center justify-between"
                        style={{ backgroundColor: branding?.headerBackgroundColor || "#dc2626" }}
                    >
                        {branding?.logoUrl && (
                            <img
                                src={branding.logoUrl}
                                alt="Site Logo"
                                className="mr-2 max-h-16 w-auto object-contain"
                            />
                        )}
                        <div className="font-bold text-lg uppercase tracking-wider">
                            <div className="text-2xl font-semibold mb-1">
                                Order #{displayedOrderNumber}
                            </div>
                            <div className="text-white-500 text-sm">
                                {order.fulfillment_time || "No time"}{" "}
                                {order.fulfillment_date
                                    ? new Date(order.fulfillment_date).toLocaleDateString()
                                    : ""}
                            </div>
                        </div>
                    </div>

                    {/* Status flow row */}
                    <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3 mt-3">
                        {flow.map((step, index) => {
                            const { label, colorClasses } = getStatusColorAndLabel(step);
                            const isCurrent = step === order.status;
                            const isLastStep = index === flow.length - 1;
                            const textTailwindClass = extractTextColorClass(colorClasses);
                            const colorMap: Record<string, string> = {
                                "text-blue-800": "rgba(59,130,246,0.7)",
                                "text-orange-800": "rgba(217,119,6,0.7)",
                            };
                            const pulseColor = colorMap[textTailwindClass] ?? "rgba(59,130,246,0.7)";
                            const activeStyles = isCurrent
                                ? {
                                    border: "2px solid currentColor",
                                    "--pulse-color": pulseColor,
                                }
                                : {};

                            const opacityClass = isCurrent ? "opacity-100" : "opacity-50";

                            return (
                                <div key={step} className="flex items-center">
                                    <div
                                        className={`
                      ${colorClasses}
                      ${opacityClass}
                      px-2 py-1 rounded-full text-md transition-colors
                      ${isCurrent ? "animate-pulse-border" : ""}
                    `}
                                        style={activeStyles as React.CSSProperties}
                                    >
                                        {label}
                                    </div>
                                    {!isLastStep && (
                                        <FiChevronRight className="mx-1 text-gray-400" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* If fulfillment_date/time => CountdownTimer */}
                    {order.fulfillment_date && order.fulfillment_time && (
                        <CountdownTimer
                            targetDate={new Date(
                                `${order.fulfillment_date}T${order.fulfillment_time}:00`
                            )}
                        />
                    )}

                    {/* instructions if any */}
                    {fulfillmentInstructions && (
                        <div className="flex items-center justify-center">
                            <div className="mt-4 p-3 w-[100%] sm:w-[75%] rounded text-sm font-bold text-gray-800 bg-gray-100 text-center">
                                {fulfillmentInstructions}
                            </div>
                        </div>
                    )}

                    {/* dashed line */}
                    <div className="relative">
                        <svg
                            className="text-gray-400 mx-auto"
                            width="100%"
                            height="20"
                            preserveAspectRatio="none"
                        >
                            <line
                                x1="0"
                                y1="10"
                                x2="100%"
                                y2="10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeDasharray="6,6"
                            />
                        </svg>
                    </div>

                    <div className="p-5 flex flex-col sm:flex-row items-center justify-between">
                        {order.customer_note && (
                            <div className="text-xs text-gray-400 italic mt-1 text-center sm:text-right">
                                Note: {order.customer_note}
                            </div>
                        )}
                    </div>

                    {/* Order details */}
                    <div className="flex-1 overflow-y-auto pt-1 pb-0">
                        {orderDetails.length < 1 ? (
                            <p className="text-gray-500 text-sm p-3">No products in order.</p>
                        ) : (
                            <div className="space-y-3 p-3">
                                {orderDetails.map((detail) => {
                                    const itemName = pickDetailName(detail, userLocale);

                                    // sum sub line total
                                    const subLineTotal =
                                        detail.subproducts?.reduce(
                                            (acc, sp) => acc + (sp.price ?? 0) * (sp.quantity ?? 1),
                                            0
                                        ) ?? 0;
                                    // final line => (price + subLineTotal) * quantity
                                    const lineTotal =
                                        ((detail.price ?? 0) + subLineTotal) * detail.quantity;

                                    return (
                                        <div
                                            key={detail.id}
                                            className="bg-white shadow-sm p-3 rounded text-sm"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-gray-600">
                                                    x {detail.quantity}
                                                </div>
                                                <div className="flex-1 ml-3 flex justify-between">
                                                    <div className="font-semibold">
                                                        {itemName}
                                                    </div>
                                                    <div className="ml-4 text-gray-500">
                                                        €{lineTotal.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                            {(detail.subproducts ?? []).length > 0 && (
                                                <ul className="ml-4 list-disc list-inside mt-1 text-gray-500">
                                                    {detail.subproducts?.map((sp) => {
                                                        const spQty = sp.quantity ?? 1;
                                                        const spLineTotal = (sp.price ?? 0) * spQty;
                                                        const spName = pickSubproductName(sp, userLocale);

                                                        return (
                                                            <li key={sp.id} className="flex justify-between">
                                                                <span>
                                                                    {spQty > 1
                                                                        ? `${spName} x${spQty}`
                                                                        : spName}
                                                                </span>
                                                                <span className="ml-2 text-gray-400">
                                                                    +€{spLineTotal.toFixed(2)}
                                                                </span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* If discount => show discount line */}
                        {(order.discountTotal ?? 0) > 0 && (
                            <div className="flex items-center justify-end p-3 pt-3 text-red-600">
                                <span className="text-md font-semibold">
                                    Discount: -€{order.discountTotal?.toFixed(2)}
                                </span>
                            </div>
                        )}

                        {/* If promotionsUsed => extra lines */}
                        {order.promotionsUsed && (
                            <div className="px-3 text-sm text-gray-700 space-y-1">
                                {/* Only display if > 0 */}
                                {order.promotionsUsed.pointsUsed &&
                                    order.promotionsUsed.pointsUsed > 0 && (
                                        <div>
                                            Membership Points: -€
                                            {((order.promotionsUsed.pointsUsed ?? 0) * 0.01).toFixed(2)}
                                        </div>
                                    )}
                                {order.promotionsUsed.creditsUsed &&
                                    order.promotionsUsed.creditsUsed > 0 && (
                                        <div>
                                            Store Credits: -€
                                            {(order.promotionsUsed.creditsUsed ?? 0).toFixed(2)}
                                        </div>
                                    )}
                                {order.promotionsUsed.couponUsed?.barcode && (
                                    <div>
                                        Coupon: {order.promotionsUsed.couponUsed.barcode}
                                        {order.promotionsUsed.couponUsed.value_type === "fixed"
                                            ? ` => -€${order.promotionsUsed.couponUsed.value}`
                                            : ` => -${order.promotionsUsed.couponUsed.value}%`}
                                    </div>
                                )}
                                {order.promotionsUsed.giftVoucherUsed?.barcode &&
                                    (order.promotionsUsed.giftVoucherUsed.value ?? 0) > 0 && (
                                        <div>
                                            Gift Voucher: {order.promotionsUsed.giftVoucherUsed.barcode} =&gt;
                                            -€{(order.promotionsUsed.giftVoucherUsed.value ?? 0).toFixed(2)}
                                        </div>
                                    )}
                            </div>
                        )}

                        {/* shipping cost if any */}
                        {shippingCost > 0 && (
                            <div className="flex items-center justify-end p-3 pt-3">
                                <span className="text-lg font-semibold">
                                    Shipping: €{shippingCost.toFixed(2)}
                                </span>
                            </div>
                        )}

                        {/* final total */}
                        <div className="flex items-center justify-end p-3 pt-3">
                            <span className="text-lg font-bold">
                                Total: €{totalPaid.toFixed(2)}
                            </span>
                        </div>

                        {/* optional google / tripadvisor links */}
                        {(branding?.googleReviewUrl || branding?.tripAdvisorUrl) && (
                            <>
                                <div className="relative">
                                    <svg
                                        className="text-gray-300 mx-auto"
                                        width="100%"
                                        height="20"
                                        preserveAspectRatio="none"
                                    >
                                        <line
                                            x1="0"
                                            y1="10"
                                            x2="100%"
                                            y2="10"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeDasharray="6,6"
                                        />
                                    </svg>
                                </div>
                                <div className="p-3 flex flex-col sm:flex-row items-center justify-center gap-4">
                                    {branding.googleReviewUrl && (
                                        <a
                                            href={branding.googleReviewUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="
                        inline-flex items-center
                        bg-white border border-gray-300
                        px-3 py-4
                        text-sm text-gray-700
                        rounded shadow-sm
                        hover:shadow hover:bg-gray-50
                        transition
                      "
                                        >
                                            <img
                                                src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOO8Sb3VSgIBrfRYvW6cUA"
                                                alt="Google"
                                                className="h-5 w-auto object-contain mr-2"
                                            />
                                            <span className="font-medium">
                                                Leave a Google Review
                                            </span>
                                        </a>
                                    )}
                                    {branding.tripAdvisorUrl && (
                                        <a
                                            href={branding.tripAdvisorUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="
                        inline-flex items-center
                        bg-white border border-gray-300
                        px-3 py-4
                        text-sm text-gray-700
                        rounded shadow-sm
                        hover:shadow hover:bg-gray-50
                        transition
                      "
                                        >
                                            <img
                                                src="https://static.tacdn.com/img2/brand_refresh/Tripadvisor_lockup_horizontal_secondary_registered.svg"
                                                alt="TripAdvisor"
                                                className="h-5 w-auto object-contain mr-2"
                                            />
                                            <span className="font-medium">
                                                Review on TripAdvisor
                                            </span>
                                        </a>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Non-Kiosk => Create New Order button */}
                    <div>
                        <button
                            onClick={handleCreateNewOrderClick}
                            style={{ backgroundColor: brandCTA }}
                            className="
                block w-full mt-0 text-white
                px-4 py-3 rounded-b-xl text-center text-lg
              "
                        >
                            {createNewOrderLoading ? (
                                // spinner
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    className="mx-auto animate-spin"
                                    strokeWidth="3"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <circle cx="12" cy="12" r="10" className="opacity-20" />
                                    <path d="M12 2 A10 10 0 0 1 22 12" className="opacity-75" />
                                </svg>
                            ) : (
                                "Create New Order"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
