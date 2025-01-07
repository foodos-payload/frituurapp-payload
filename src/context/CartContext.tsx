// File: /app/(app)/order/components/cart/CartContext.tsx
"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";

/**
 * If the subproduct is linked to a product,
 * store minimal product data for reference.
 */
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

/**
 * A subproduct selection might contain references to a 'linkedProduct'.
 */
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
};

/**
 * The main item in your cart.
 */
export type CartItem = {
    productId: string;
    productName: string;
    productNameNL?: string;
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

/**
 * The shape of the entire CartContext, including operations.
 */
type CartContextValue = {
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
};

/**
 * React context for the cart.
 */
const CartContext = createContext<CartContextValue | undefined>(undefined);

/**
 * Hook to consume the cart context.
 */
export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}

/**
 * Utility: Create a unique "signature" for cart items.
 */
export function getLineItemSignature(item: CartItem): string {
    const subIds = item.subproducts
        ?.map((sp) => sp.subproductId)
        .sort()
        .join(",");
    const notePart = item.note || "";
    return `${item.productId}|[${subIds || ""}]|note=${notePart}`;
}

/**
 * CartProvider: Manages the cart state and logic.
 */
export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [selectedShippingMethod, setSelectedShippingMethod] = useState<
        "dine-in" | "takeaway" | "delivery" | null
    >(null);

    /**
     * On mount, load cart items and shipping method from localStorage if available.
     */
    useEffect(() => {
        const storedItems = localStorage.getItem("cartItems");
        const storedShippingMethod = localStorage.getItem("selectedShippingMethod");

        if (storedItems) {
            try {
                setItems(JSON.parse(storedItems));
            } catch (err) {
                console.warn("Failed to parse stored cart items", err);
            }
        }

        if (storedShippingMethod) {
            setSelectedShippingMethod(storedShippingMethod as "dine-in" | "takeaway" | "delivery");
        }
    }, []);

    /**
     * Persist changes to localStorage.
     */
    useEffect(() => {
        localStorage.setItem("cartItems", JSON.stringify(items));
        localStorage.setItem("selectedShippingMethod", selectedShippingMethod || "");
    }, [items, selectedShippingMethod]);

    /**
     * Add a new item to the cart or update quantity if it already exists.
     */
    function addItem(newItem: CartItem) {
        const newSig = getLineItemSignature(newItem);

        setItems((prev) => {
            const existingIndex = prev.findIndex(
                (i) => getLineItemSignature(i) === newSig
            );

            if (existingIndex >= 0) {
                return prev.map((item, idx) =>
                    idx === existingIndex
                        ? { ...item, quantity: item.quantity + newItem.quantity }
                        : item
                );
            }

            return [...prev, newItem];
        });
    }

    /**
     * Update an existing item in the cart.
     */
    function updateItem(lineSignature: string, updates: Partial<CartItem>) {
        setItems((prev) =>
            prev.map((item) =>
                getLineItemSignature(item) === lineSignature
                    ? { ...item, ...updates }
                    : item
            )
        );
    }

    /**
     * Update the quantity of an item or remove it if quantity is 0.
     */
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

    /**
     * Remove an item from the cart.
     */
    function removeItem(lineSignature: string) {
        setItems((prev) =>
            prev.filter((item) => getLineItemSignature(item) !== lineSignature)
        );
    }

    /**
     * Clear the cart and reset the selected shipping method.
     */
    function clearCart() {
        setItems([]);
        setSelectedShippingMethod(null);
    }

    /**
     * Set the shipping method.
     */
    function setShippingMethod(method: "dine-in" | "takeaway" | "delivery") {
        setSelectedShippingMethod(method);
    }

    /**
     * Get the total item count in the cart.
     */
    function getItemCount() {
        return items.reduce((sum, item) => sum + item.quantity, 0);
    }

    /**
     * Get the total cost of the cart.
     */
    function getCartTotal() {
        let total = 0;
        for (const item of items) {
            // 1) Base item price
            let linePrice = item.price * item.quantity;

            // 2) Add subproduct prices
            if (item.subproducts && item.subproducts.length > 0) {
                for (const sp of item.subproducts) {
                    linePrice += sp.price * item.quantity;
                }
            }

            total += linePrice;
        }
        return total;
    }


    const value: CartContextValue = {
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
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
