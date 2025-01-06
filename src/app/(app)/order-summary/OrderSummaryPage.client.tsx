// File: /src/app/(app)/order-summary/OrderSummaryPage.client.tsx
"use client"

import React, {
    useEffect,
    useRef,
    useState,
    useCallback,
} from "react";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/utilities/fetcher";
import { NON_BREAKING_SPACE } from "@payloadcms/richtext-lexical";
import { FiChevronRight } from "react-icons/fi";
import { CountdownTimer } from "./CountdownTimer";
import './ordersummary.css';


// 1) Types
type OrderStatus =
    | "pending_payment"
    | "awaiting_preparation"
    | "in_preparation"
    | "complete"
    | "cancelled"
    | "in_delivery"
    | "ready_for_pickup";

type Branding = {
    logoUrl?: string;
    adImage?: string;
    headerBackgroundColor?: string;
    categoryCardBgColor?: string;
    primaryColorCTA?: string;
    siteTitle?: string;
    siteHeaderImg?: string;
};

type FulfillmentMethod = "delivery" | "takeaway" | "dine_in" | "unknown";

// A single "subproduct" (e.g., a sauce).
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
}

// Payment info
interface Payment {
    id: string;
    payment_method: { id: string; provider?: string };
    amount: number;
}

// A single line item in the order
interface OrderDetail {
    id: string;
    product: {
        id: string;
        name_nl?: string;
        name_en?: string;
        name_de?: string;
        name_fr?: string;
    };
    // The localized name of this item (if any)
    name_nl?: string;
    name_en?: string;
    name_de?: string;
    name_fr?: string;

    quantity: number;
    price?: number;
    tax?: number;
    subproducts?: Subproduct[];
}

interface CustomerDetails {
    firstName?: string;
    lastName?: string;
    // etc...
}

// Full order object
interface Order {
    id: number;
    tempOrdNr?: number;
    status: OrderStatus;
    fulfillmentMethod?: FulfillmentMethod;
    date_created?: string;
    customer_note?: string;
    order_details?: OrderDetail[];
    payments?: Payment[];
    total?: number; // the total paid or total price, if available
    fulfillment_time?: string;
    fulfillment_date?: string;
    fulfillment_method?: string;
    customer_details?: CustomerDetails;
}

interface OrderSummaryPageProps {
    orderId: string;
    kioskMode?: boolean;
    hostSlug: string;
    branding?: Branding;
    fulfillments?: any[];
}

// 2) Helpers for localizing product/subproduct names
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

// 3) Component
export function OrderSummaryPage({
    orderId,
    kioskMode,
    hostSlug,
    branding,
    fulfillments,
}: OrderSummaryPageProps) {
    const router = useRouter();

    // 3.1) We read locale from localStorage (default "nl" if not found)
    const [userLocale, setUserLocale] = useState("nl");
    useEffect(() => {
        const storedLocale = localStorage.getItem("userLocale") || "nl";
        setUserLocale(storedLocale);
    }, []);

    // 3.2) Kiosk countdown
    const [countdown, setCountdown] = useState(30);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);
    const previousStatusRef = useRef<OrderStatus | null>(null);

    const brandCTA = branding?.primaryColorCTA || "#3b82f6"; // fallback to a bluish color

    // 3.3) Fetch the order with SWR
    const {
        data: order,
        error,
        isLoading,
        isValidating,
    } = useSWR<Order>(
        `/api/orders?host=${encodeURIComponent(hostSlug)}&orderId=${encodeURIComponent(orderId)}`,
        fetcher,
        { refreshInterval: 5000 }
    );

    // 3.4) Confetti
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

    // 3.5) Check for status transition => confetti
    useEffect(() => {
        if (!order) return;
        const prevStatus = previousStatusRef.current;
        if (prevStatus !== "complete" && order.status === "complete") {
            triggerConfetti();
        }
        previousStatusRef.current = order.status;
    }, [order, triggerConfetti]);

    // 3.6) Kiosk Countdown
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

    // 3.7) Navigation
    const handleCreateNewOrderClick = useCallback(() => {
        if (kioskMode) {
            router.push(`/index?kiosk=true`);
        } else {
            router.push(`/index`);
        }
    }, [kioskMode, router]);

    //
    // 4) Handle loading / error states
    //
    if (error) {
        return (
            <div className="text-center p-8 text-red-500">
                <h2 className="text-2xl font-bold mb-2">Error</h2>
                <p>{error.message || "Could not fetch order."}</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <p className="text-2xl font-semibold">
                    Loading order summary...
                </p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center p-8 text-gray-500">
                <p>No order data.</p>
            </div>
        );
    }

    //
    // 5) Display logic
    //
    const showRefreshingBadge = isValidating;
    const totalPaid = order.total ?? 0; // If your API includes a .total field

    // For a small "status GIF"
    let statusGif: string | null = null;
    switch (order.status) {
        case "awaiting_preparation":
            statusGif = "/images/order_awaiting_preparation.gif";
            break;
        case "in_preparation":
            statusGif = "/images/order_preparing.gif";
            break;
        case "complete":
            statusGif = "/images/order_ready.gif";
            break;
        default:
            statusGif = null;
            break;
    }


    // Decide which statuses to display, etc.
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

    function getStatusColorAndLabel(status: string) {
        let label = status;
        let colorClasses = "bg-gray-100 text-gray-700"; // default fallback

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
            case "done":
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

    // We'll parse out the text color for the border
    function extractTextColorClass(colorClasses: string): string {
        const match = colorClasses.match(/(text-[a-z]+-\d{3})/);
        return match?.[1] || "text-gray-700";
    }

    // If "in_preparation" or "in_delivery" => show "..." animation
    function AnimatedEllipsis() {
        const [dotCount, setDotCount] = React.useState(1);

        React.useEffect(() => {
            const interval = setInterval(() => {
                setDotCount((prev) => (prev === 3 ? 1 : prev + 1));
            }, 500);
            return () => clearInterval(interval);
        }, []);

        return <span className="ml-1">{".".repeat(dotCount)}</span>;
    }

    const orderDetails = order.order_details || [];
    const displayedOrderNumber = order.tempOrdNr ?? order.id;
    const method = order?.fulfillment_method;  // exact name
    const flow = getStatusFlow(order.fulfillment_method ?? "unknown");

    // Build instructions from fulfillments array
    let fulfillmentInstructions = "";
    if (fulfillments && Array.isArray(fulfillments)) {
        const matched = fulfillments.find((f) => f.method_type === method);
        fulfillmentInstructions = matched?.settings?.pickup_instructions || "";
    }

    // If the order has a name => prepend “Hi Jonas, ”
    if (fulfillmentInstructions && order.customer_details?.firstName) {
        fulfillmentInstructions = `Hi ${order.customer_details.firstName}, ${fulfillmentInstructions}`;
    }

    // Example: if we have “dine_in” => “A staff member will bring your order…”
    // (some custom logic you had before)
    let instructionsText = "";
    if (method === "delivery") {
        instructionsText = "Delivery instructions here...";
    } else if (method === "takeaway") {
        instructionsText = "Please proceed to the takeaway counter.";
    } else if (method === "dine_in") {
        instructionsText = "A staff member will bring your order to your table.";
    }


    function parseFulfillmentDateTime(order: Order): Date | null {
        // If either is missing, return null
        if (!order.fulfillment_date || !order.fulfillment_time) return null

        // fulfillment_date: "2025-01-08T23:00:00.000Z"
        // fulfillment_time: "09:15"
        // We'll parse both into a single Date object
        try {
            // Convert "2025-01-08T23:00:00.000Z" into a local date, then set hours/min to the string
            // Or do something more robust (timezones, etc.)
            const datePart = new Date(order.fulfillment_date) // might be midnight
            const [hourStr, minuteStr] = order.fulfillment_time.split(":")
            const hour = parseInt(hourStr, 10)
            const minute = parseInt(minuteStr, 10)

            datePart.setHours(hour)
            datePart.setMinutes(minute)
            datePart.setSeconds(0)
            return datePart
        } catch (err) {
            console.error("Failed to parse fulfillment date/time:", err)
            return null
        }
    }

    const targetDate = parseFulfillmentDateTime(order);

    function formatFulfillmentDate(dateStr?: string): string {
        if (!dateStr) return "No date";
        const date = new Date(dateStr);
        // For dd/mm, e.g. "05/01" => day = 05, month = 01
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${day}/${month}`;
    }



    //
    // 6) Render
    //
    return (
        <div
            className={
                kioskMode
                    ? "relative text-4xl w-full min-h-[600px] flex flex-col items-center"
                    : "relative text-base w-full min-h-[600px] flex flex-col items-center justify-center p-0 sm:8 text-gray-800"
            }
        >
            {/* Show "Refreshing..." if SWR is revalidating */}
            {/* {showRefreshingBadge && (
                <div className="absolute top-2 right-2 bg-white/70 px-4 py-2 rounded shadow flex items-center gap-2 text-sm text-gray-600 z-50">
                    <svg
                        className="animate-spin -ml-1 mr-1 h-4 w-4 text-gray-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.374 0 0 5.374 0 12h4z"
                        />
                    </svg>
                    Refreshing...
                </div>
            )} */}

            {/* Non-kiosk => fancy ticket UI */}
            {!kioskMode && (
                <div className="w-full max-w-xl bg-white shadow-lg rounded-xl overflow-hidden relative flex flex-col min-h-[550px] ">
                    {/* Top color bar => dynamic or fallback red-600 */}
                    <div
                        className="p-4 text-white flex items-center justify-between"
                        style={{ backgroundColor: branding?.headerBackgroundColor || "#dc2626" }}
                    >
                        {/* Logo on the left, if branding.logoUrl exists */}
                        {branding?.logoUrl && (
                            <img
                                src={branding.logoUrl}
                                alt="Site Logo"
                                className="mr-2 max-h-16 w-auto object-contain"
                            />
                        )}

                        {/* order date time or fallback */}
                        <div className="font-bold text-lg uppercase tracking-wider">
                            <div className="text-2xl font-semibold mb-1">
                                Order #{order.tempOrdNr ?? order.id}
                            </div>
                            <div className="text-white-500 text-sm">
                                {order.fulfillment_time || "No time"} {formatFulfillmentDate(order.fulfillment_date)}
                            </div>
                        </div>
                    </div>

                    {/* Status row */}
                    <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3 mt-3">
                        {flow.map((step, index) => {
                            const { label, colorClasses } = getStatusColorAndLabel(step);
                            const isCurrent = step === order.status;
                            const isLastStep = index === flow.length - 1;

                            // e.g. colorClasses might be "bg-blue-100 text-blue-800"
                            // We parse out "text-blue-800"
                            const textTailwindClass = extractTextColorClass(colorClasses);
                            // => "text-blue-800"

                            // Map to an actual RGBA
                            const colorMap: Record<string, string> = {
                                "text-blue-800": "rgba(59,130,246,0.7)",
                                "text-orange-800": "rgba(217,119,6,0.7)",
                                // add more as needed
                            };
                            const pulseColor = colorMap[textTailwindClass] ?? "rgba(59,130,246,0.7)";

                            // If active => add border & our pulse class, plus set --pulse-color
                            const activeStyles = isCurrent
                                ? {
                                    border: "2px solid currentColor", // or "2px solid transparent" + border-current 
                                    // We pass the color to the custom property
                                    // Notice the double quotes for inline style in TSX
                                    "--pulse-color": pulseColor
                                }
                                : {};

                            // Lower opacity for non-active
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
                    {targetDate && <CountdownTimer targetDate={targetDate} />}

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

                    {/* main body => order info */}
                    <div className="p-5 flex flex-col sm:flex-row items-center justify-between">

                        <div className="mt-4 sm:mt-0 text-center sm:text-right">
                            {order.customer_note && (
                                <div className="text-xs text-gray-400 italic mt-1">
                                    Note: {order.customer_note}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* bottom area => details + instructions + total */}
                    <div className="flex-1 overflow-y-auto pt-1 pb-0">
                        {orderDetails.length < 1 ? (
                            <p className="text-gray-500 text-sm">No products in order.</p>
                        ) : (
                            <div className="space-y-0 p-3 pb-0">
                                {orderDetails.map((detail) => {
                                    const itemName = pickDetailName(detail, userLocale);

                                    return (
                                        <div
                                            key={detail.id}
                                            className="bg-white border-b-2 p-3 text-sm"
                                        >
                                            {/* Top row => Quantity and “Name + price” on the same row */}
                                            <div className="flex items-center justify-between mb-1">
                                                {/* Quantity on the left */}
                                                <div className="text-left text-gray-600">
                                                    x {detail.quantity}
                                                </div>

                                                {/* Name + price on the right */}
                                                <div className="flex-1 ml-3 flex justify-between">
                                                    {/* Product name */}
                                                    <div className="font-semibold">
                                                        {itemName}
                                                    </div>

                                                    {/* Price */}
                                                    <div className="ml-4 text-gray-500">
                                                        €{detail.price?.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Subproducts list */}
                                            {detail.subproducts?.length > 0 && (
                                                <ul className="ml-8 list-disc list-inside mt-2 text-gray-500 space-y-1">
                                                    {detail.subproducts.map((sp) => {
                                                        const spName = pickSubproductName(sp, userLocale);

                                                        return (
                                                            <li key={sp.id} className="flex justify-between">
                                                                {/* Subproduct name */}
                                                                <span>- {spName}</span>
                                                                {/* Subproduct price */}
                                                                <span className="ml-2 text-gray-400">
                                                                    +€{sp.price?.toFixed(2) ?? "?"}
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

                        {/* Fulfillment instructions, if any */}
                        {/* {instructionsText && (
                            <div className="mt-6 p-3 border border-dashed border-gray-300 rounded text-sm text-gray-600">
                                {instructionsText}
                            </div>
                        )} */}
                        <div className="flex items-center justify-end p-3 pt-3">
                            <span className="text-lg font-bold">
                                €{totalPaid.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="">


                        {!kioskMode && (
                            <button
                                onClick={handleCreateNewOrderClick}
                                style={{ backgroundColor: brandCTA }}
                                className="
                                    block
                                    w-full
                                    mt-0
                                    text-white
                                    px-4 py-3
                                    rounded-b-xl
                                    text-center
                                    text-lg
                                    "
                            >
                                Create New Order
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* kiosk mode => big button with countdown */}
            {kioskMode ? (
                <button
                    id="newOrderButton"
                    onClick={handleCreateNewOrderClick}
                    className="bg-green-600 text-white px-8 py-4 mt-8 rounded"
                >
                    Create New Order ({countdown}s)
                </button>
            ) : (
                <p></p>
            )}
        </div>
    );
}
