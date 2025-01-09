// File: /app/(app)/order/components/cart/CartContext.tsx
"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";

/* ─────────────────────────────────────────────────────────────────────
   1) Types for subproducts, cart items, etc.
   ───────────────────────────────────────────────────────────────────── */

export type LinkedProductData = {
    id: string;
    name_nl: string;
    description_nl?: string;
    priceUnified: boolean;
    price: number | null;
    image?: {
        url: string;
        alt?: string;
    } | null;
};

export type SubproductSelection = {
    tax_dinein?: number | null;
    subproductId: string;
    name_nl: string;
    name_en?: string;
    name_de?: string;
    name_fr?: string;
    price: number;
    tax?: number | null;
    linkedProduct?: LinkedProductData;
    image?: {
        url: string;
        alt?: string;
    } | null;
    taxRate?: number;
    taxRateDineIn?: number;
    quantity?: number;
};

/** The main product line item in the cart. */
export type CartItem = {
    productId: string;
    productName: string; // fallback name
    productNameNL?: string; // localized
    productNameEN?: string;
    productNameDE?: string;
    productNameFR?: string;
    price: number;
    quantity: number;
    note?: string;
    image?: {
        url: string;
        alt?: string;
    } | null;
    subproducts?: SubproductSelection[];
    hasPopups?: boolean;
    taxRate?: number;
    taxRateDineIn?: number;
};

/* ─────────────────────────────────────────────────────────────────────
   2) Types for Coupons, Gift Vouchers, Memberships, Loyalty, & Customer
   ───────────────────────────────────────────────────────────────────── */

export type CouponInfo = {
    id: string;
    barcode: string;
    value: number;
    value_type: "fixed" | "percentage";
    valid_from: string;
    valid_until: string;
    max_uses?: number | null;
    uses?: number;
    used?: boolean;
};

export type GiftVoucherInfo = {
    id: string;
    barcode: string;
    value: number;
    valid_from: string;
    valid_until: string;
    used: boolean;
};

export type LoyaltyProgram = {
    id: string;
    program_name: string;
    points_per_purchase: number;
    redeem_ratio: number; // e.g. 10 => 10 points = 1 currency
    status: "active" | "inactive";
    description?: string;
};

export type Membership = {
    id: string;
    role: {
        id: string;
        label: string;
        value: string;
        defaultRole?: boolean;
        loyaltyPrograms?: LoyaltyProgram[];
    };
    points: number;    // how many points user currently has
    status: string;
    dateJoined?: string;
};

export type CustomerInfo = {
    id: string;
    firstname: string;
    lastname: string;
    email?: string;
    phone?: string | null;
    barcode?: string;
    memberships?: Membership[];
    // plus other fields if needed
};

/* ─────────────────────────────────────────────────────────────────────
   3) The shape of our CartContext
   ───────────────────────────────────────────────────────────────────── */

type CartContextValue = {
    // Basic cart
    items: CartItem[];
    selectedShippingMethod: "dine-in" | "takeaway" | "delivery" | null;

    addItem: (newItem: CartItem) => void;
    updateItem: (lineSignature: string, updates: Partial<CartItem>) => void;
    updateItemQuantity: (lineSignature: string, newQty: number) => void;
    removeItem: (lineSignature: string) => void;
    clearCart: () => void;
    setShippingMethod: (method: "dine-in" | "takeaway" | "delivery") => void;

    getItemCount: () => number;
    getCartTotal: () => number;

    // Discount/loyalty fields
    coupon: CouponInfo | null;
    giftVoucher: GiftVoucherInfo | null;
    customer: CustomerInfo | null;

    fetchCustomerByCode: (barcode: string) => Promise<void>;
    fetchCouponsAndGiftVouchers: () => Promise<void>;

    applyCoupon: (barcode: string) => Promise<void>;
    removeCoupon: () => void;
    applyGiftVoucher: (barcode: string) => Promise<void>;
    removeGiftVoucher: () => void;

    /** If the user wants to redeem membership points. */
    applyPointsUsage: (points: number) => void;

    /** If the user wants to apply store credits. */
    applyCustomerCredits: (amount: number) => void;

    /** We store them locally so we can subtract in getCartTotalWithDiscounts. */
    pointsUsed: number;   // how many *currency units* we've discounted from membership
    creditsUsed: number;  // how many currency units we've discounted from store credits

    getCartTotalWithDiscounts: () => number;
};

/* ─────────────────────────────────────────────────────────────────────
   4) Create the React context & custom hook
   ───────────────────────────────────────────────────────────────────── */

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}

/**
 * Utility: create a unique signature for a cart line item.
 */
export function getLineItemSignature(item: CartItem): string {
    const subIds = item.subproducts?.map((sp) => sp.subproductId).sort().join(",") || "";
    const notePart = item.note || "";
    return `${item.productId}|[${subIds}]|note=${notePart}`;
}

/* ─────────────────────────────────────────────────────────────────────
   5) The CartProvider implementation
   ───────────────────────────────────────────────────────────────────── */

export function CartProvider({ children }: { children: ReactNode }) {
    // Basic cart states
    const [items, setItems] = useState<CartItem[]>([]);
    const [selectedShippingMethod, setSelectedShippingMethod] =
        useState<"dine-in" | "takeaway" | "delivery" | null>(null);

    // Discounts / loyalty
    const [coupon, setCoupon] = useState<CouponInfo | null>(null);
    const [giftVoucher, setGiftVoucher] = useState<GiftVoucherInfo | null>(null);
    const [customer, setCustomer] = useState<CustomerInfo | null>(null);

    // We store how many membership points & store credits the user has *converted into currency*
    // for discount. E.g. if ratio=10 => using 20 points => 2.0 currency => pointsUsed=2.0
    const [pointsUsed, setPointsUsed] = useState<number>(0);
    const [creditsUsed, setCreditsUsed] = useState<number>(0);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const storedItems = localStorage.getItem("cartItems");
            const storedMethod = localStorage.getItem("selectedShippingMethod");
            const storedCoupon = localStorage.getItem("appliedCoupon");
            const storedGiftVoucher = localStorage.getItem("appliedGiftVoucher");
            const storedPoints = localStorage.getItem("pointsUsed");
            const storedCredits = localStorage.getItem("creditsUsed");

            if (storedItems) setItems(JSON.parse(storedItems));
            if (storedMethod) setSelectedShippingMethod(storedMethod as any);
            if (storedCoupon) setCoupon(JSON.parse(storedCoupon));
            if (storedGiftVoucher) setGiftVoucher(JSON.parse(storedGiftVoucher));
            if (storedPoints) setPointsUsed(parseFloat(storedPoints));
            if (storedCredits) setCreditsUsed(parseFloat(storedCredits));
        } catch {
            // ignore parse errors
        }
    }, []);

    // Persist changes to localStorage
    useEffect(() => {
        localStorage.setItem("cartItems", JSON.stringify(items));
        localStorage.setItem("selectedShippingMethod", selectedShippingMethod || "");
        localStorage.setItem("pointsUsed", pointsUsed.toString());
        localStorage.setItem("creditsUsed", creditsUsed.toString());
    }, [items, selectedShippingMethod, pointsUsed, creditsUsed]);

    // Watch coupon. If present, store it; if removed, clear from localStorage
    useEffect(() => {
        if (coupon) {
            localStorage.setItem("appliedCoupon", JSON.stringify(coupon));
        } else {
            localStorage.removeItem("appliedCoupon");
        }
    }, [coupon]);

    // Persist gift voucher to localStorage
    useEffect(() => {
        if (giftVoucher) {
            localStorage.setItem("appliedGiftVoucher", JSON.stringify(giftVoucher));
        } else {
            localStorage.removeItem("appliedGiftVoucher");
        }
    }, [giftVoucher]);


    /* ───────────── Cart CRUD Methods ───────────── */

    function addItem(newItem: CartItem) {
        const newSig = getLineItemSignature(newItem);
        setItems((prev) => {
            const existingIndex = prev.findIndex(
                (i) => getLineItemSignature(i) === newSig
            );
            if (existingIndex >= 0) {
                // increment quantity
                return prev.map((item, idx) =>
                    idx === existingIndex
                        ? { ...item, quantity: item.quantity + newItem.quantity }
                        : item
                );
            }
            return [...prev, newItem];
        });
    }

    function updateItem(lineSignature: string, updates: Partial<CartItem>) {
        setItems((prev) =>
            prev.map((item) =>
                getLineItemSignature(item) === lineSignature
                    ? { ...item, ...updates }
                    : item
            )
        );
    }

    function updateItemQuantity(lineSignature: string, newQty: number) {
        setItems((prev) =>
            prev
                .map((item) =>
                    getLineItemSignature(item) === lineSignature
                        ? { ...item, quantity: newQty }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    }

    function removeItem(lineSignature: string) {
        setItems((prev) =>
            prev.filter((i) => getLineItemSignature(i) !== lineSignature)
        );
    }

    function clearCart() {
        setItems([]);
        setSelectedShippingMethod(null);

        // also clear discount states
        setCoupon(null);
        setGiftVoucher(null);
        setCustomer(null);

        // reset applied points/credits
        setPointsUsed(0);
        setCreditsUsed(0);
    }

    function setShippingMethod(method: "dine-in" | "takeaway" | "delivery") {
        setSelectedShippingMethod(method);
    }

    function getItemCount() {
        return items.reduce((sum, item) => sum + item.quantity, 0);
    }

    function getCartTotal() {
        let total = 0;
        for (const item of items) {
            let linePrice = item.price * item.quantity;
            if (item.subproducts) {
                for (const sp of item.subproducts) {
                    const subQty = sp.quantity ?? 1;
                    linePrice += sp.price * subQty * item.quantity;
                }
            }
            total += linePrice;
        }
        return total;
    }

    /* ─────────────────────────────────────────────────────────────────────
       Additional (Discount / Loyalty) Methods
       ───────────────────────────────────────────────────────────────────── */

    async function fetchCustomerByCode(barcode: string) {
        try {
            const res = await fetch(
                `/api/getCustomerByBarcode?barcode=${encodeURIComponent(barcode)}`
            );
            if (!res.ok) {
                return;
            }
            const data = await res.json();

            // Set the fetched customer into state
            setCustomer(data.customer);

            // NEW: store the customer's barcode in localStorage
            if (data.customer?.barcode) {
                localStorage.setItem("customerBarcode", data.customer.barcode);
            }
        } catch (err) {
            console.error("fetchCustomerByCode error:", err);
        }
    }


    async function fetchCouponsAndGiftVouchers() {
        const shopSlug = "frituur-den-overkant";
        try {
            const res = await fetch(
                `/api/getCouponsAndGiftVouchers?shop=${encodeURIComponent(shopSlug)}`
            );
            if (!res.ok) {
                return;
            }
            const data = await res.json();
            console.log("All coupons + giftVouchers =>", data);
        } catch (err) {
            console.error("fetchCouponsAndGiftVouchers error:", err);
        }
    }

    async function applyCoupon(code: string) {
        const shopSlug = "frituur-den-overkant";
        try {
            const res = await fetch(`/api/getCouponsAndGiftVouchers?shop=${shopSlug}`);
            if (!res.ok) {
                return;
            }
            const data = await res.json();
            const match = data.coupons.find((c: any) => c.barcode === code);
            if (!match) {
                return;
            }
            setCoupon({
                id: match.id,
                barcode: match.barcode,
                value: match.value,
                value_type: match.value_type,
                valid_from: match.valid_from,
                valid_until: match.valid_until,
                max_uses: match.max_uses ?? null,
                uses: match.uses ?? 0,
                used: match.used ?? false,
            });
        } catch (err) {
            console.error("applyCoupon error:", err);
        }
    }

    function removeCoupon() {
        setCoupon(null);
    }

    async function applyGiftVoucher(code: string) {
        const shopSlug = "frituur-den-overkant";
        try {
            const res = await fetch(`/api/getCouponsAndGiftVouchers?shop=${shopSlug}`);
            if (!res.ok) {
                return;
            }
            const data = await res.json();
            const match = data.giftVouchers.find((gv: any) => gv.barcode === code);
            if (!match) {
                return;
            }
            setGiftVoucher({
                id: match.id,
                barcode: match.barcode,
                value: match.value,
                valid_from: match.valid_from,
                valid_until: match.valid_until,
                used: match.used,
            });
        } catch (err) {
            console.error("applyGiftVoucher error:", err);
        }
    }

    function removeGiftVoucher() {
        setGiftVoucher(null);
    }

    /**
     * applyPointsUsage => user wants to apply some membership points.
     * We'll convert those points into currency using membership's redeem_ratio.
     * E.g. if ratio=10 => 10 points = 1 currency. So points / ratio = discount in currency.
     *
     * Then we add that discount to pointsUsed, and optionally subtract from membership itself.
     */
    function applyPointsUsage(pointsRequested: number) {
        if (!customer || !customer.memberships || !customer.memberships.length) {
            return;
        }
        const membership = customer.memberships[0]; // or whichever membership you want
        if (membership.points < pointsRequested) {
            // Not enough points => do nothing, or partial usage logic.
            return;
        }

        // find the redeem_ratio from the membership's role.loyaltyPrograms:
        let ratio = 1; // default if not found
        const loyaltyArray = membership.role.loyaltyPrograms;
        if (loyaltyArray && loyaltyArray.length > 0) {
            // pick the first program's ratio
            ratio = loyaltyArray[0].redeem_ratio || 1;
        }

        // convert points -> currency discount
        const discountAmount = pointsRequested / ratio;

        // update membership points (optional)
        const updatedMembership = {
            ...membership,
            points: membership.points - pointsRequested,
        };
        const updatedCustomer: CustomerInfo = {
            ...customer,
            memberships: [updatedMembership, ...customer.memberships.slice(1)],
        };
        setCustomer(updatedCustomer);

        // track how many currency units we discount
        setPointsUsed((prev) => prev + discountAmount);
    }

    /**
     * applyCustomerCredits => user has e.g. 1000 credits, wants to use X => 1 credit = 1 currency
     */
    function applyCustomerCredits(amount: number) {
        // If you want to also update the server or the `customer` object, do it here.
        setCreditsUsed((prev) => prev + amount);
    }

    /**
     * getCartTotalWithDiscounts => final total after coupon, gift voucher,
     * membership points usage (in currency), and store credits usage.
     */
    function getCartTotalWithDiscounts() {
        let base = getCartTotal();
        const nowIso = new Date().toISOString();

        // 1) coupon discount
        if (coupon) {
            const withinDates =
                nowIso >= coupon.valid_from && nowIso <= coupon.valid_until;
            if (withinDates && !coupon.used) {
                if (coupon.value_type === "fixed") {
                    base = Math.max(0, base - coupon.value);
                } else if (coupon.value_type === "percentage") {
                    base = base * (1 - coupon.value / 100);
                }
            }
        }

        // 2) gift voucher discount
        if (giftVoucher) {
            const withinDates =
                nowIso >= giftVoucher.valid_from && nowIso <= giftVoucher.valid_until;
            if (withinDates && !giftVoucher.used) {
                base = Math.max(0, base - giftVoucher.value);
            }
        }

        // 3) membership points usage => we have `pointsUsed` in currency
        if (pointsUsed > 0) {
            base = Math.max(0, base - pointsUsed);
        }

        // 4) store credits usage => 1:1 with currency
        if (creditsUsed > 0) {
            base = Math.max(0, base - creditsUsed);
        }

        return parseFloat(base.toFixed(2));
    }

    /* ─────────────────────────────────────────────────────────────────────
       6) Final context value
       ───────────────────────────────────────────────────────────────────── */

    const value: CartContextValue = {
        // cart core
        items,
        selectedShippingMethod,
        addItem,
        updateItem,
        updateItemQuantity,
        removeItem,
        clearCart,
        setShippingMethod,
        getItemCount,
        getCartTotal,

        // discount/loyalty
        coupon,
        giftVoucher,
        customer,
        fetchCustomerByCode,
        fetchCouponsAndGiftVouchers,
        applyCoupon,
        removeCoupon,
        applyGiftVoucher,
        removeGiftVoucher,

        // points & credits usage
        pointsUsed,
        creditsUsed,
        applyPointsUsage,
        applyCustomerCredits,

        // final total
        getCartTotalWithDiscounts,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}
