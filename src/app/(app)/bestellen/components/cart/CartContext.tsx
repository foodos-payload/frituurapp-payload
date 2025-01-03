// File: /app/(app)/bestellen/components/cart/CartContext.tsx
'use client'

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';

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
    id: string;
    name_nl: string;
    price: number;
    linkedProduct?: LinkedProductData;
    image?: {
        url: string;
        alt?: string;
    } | null;
    // Feel free to add other fields if needed
};

/**
 * The main item in your cart. Note we've renamed `basePrice` -> `price`.
 */
export type CartItem = {
    productId: string;     // The main product's ID
    productName: string;   // e.g. product.name_nl
    price: number;         // The main product's base price (renamed from basePrice)
    quantity: number;      // How many
    note?: string;         // Optional user note
    image?: {
        url: string;
        alt?: string;
    } | null;

    // Subproduct choices
    subproducts?: SubproductSelection[];

    // If you have tax or other fields, you can add them:
    taxRate?: number;      // e.g. 6, 12, 21
    // ...
};

/**
 * The shape of the entire CartContext, including operations.
 */
type CartContextValue = {
    items: CartItem[];

    addItem: (newItem: CartItem) => void;
    updateItemQuantity: (productId: string, newQty: number) => void;
    removeItem: (productId: string) => void;
    clearCart: () => void;

    // Optionally, get a total item count or total price
    getItemCount: () => number;
    getCartTotal: () => number;
};

// 1) Create the React context
const CartContext = createContext<CartContextValue | undefined>(undefined);

/**
 * 2) Custom hook to use the cart in components
 */
export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

/**
 * 3) The CartProvider component: manages items & logic
 */
export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    /**
     * On first render, load from localStorage (if present).
     */
    useEffect(() => {
        const stored = localStorage.getItem('cartItems');
        if (stored) {
            try {
                setItems(JSON.parse(stored));
            } catch (err) {
                console.warn('Failed to parse stored cart items', err);
            }
        }
    }, []);

    /**
     * On every change, save to localStorage.
     */
    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(items));
    }, [items]);

    /**
     * addItem:
     * If you want to differentiate items by subproducts, you'd need a more
     * complex "isSameLineItem" function. For simplicity, we match on productId only.
     */
    function addItem(newItem: CartItem) {
        setItems((prev) => {
            const existing = prev.find((i) => i.productId === newItem.productId);

            if (existing) {
                // Combine or increment quantity
                return prev.map((i) =>
                    i.productId === newItem.productId
                        ? {
                            ...i,
                            quantity: i.quantity + newItem.quantity,
                            // If you want to merge subproduct arrays differently, you'd do it here.
                        }
                        : i,
                );
            } else {
                // Otherwise push new
                return [...prev, newItem];
            }
        });
    }

    /**
     * updateItemQuantity:
     * If newQty is zero, remove item from the cart entirely.
     */
    function updateItemQuantity(productId: string, newQty: number) {
        setItems((prev) =>
            prev
                .map((item) =>
                    item.productId === productId
                        ? { ...item, quantity: newQty }
                        : item,
                )
                .filter((item) => item.quantity > 0),
        );
    }

    /**
     * removeItem: just filter out that productId.
     */
    function removeItem(productId: string) {
        setItems((prev) => prev.filter((item) => item.productId !== productId));
    }

    /**
     * clearCart: empty the array.
     */
    function clearCart() {
        setItems([]);
    }

    /**
     * getItemCount: sum up all `quantity`.
     */
    function getItemCount() {
        return items.reduce((sum, item) => sum + item.quantity, 0);
    }

    /**
     * getCartTotal: sum up (product price * quantity) + subproduct extras.
     */
    function getCartTotal() {
        let total = 0;

        for (const cartItem of items) {
            // product's price times quantity
            const baseCost = cartItem.price * cartItem.quantity;

            // subproduct prices
            let subCost = 0;
            if (cartItem.subproducts && cartItem.subproducts.length > 0) {
                const sumSubs = cartItem.subproducts.reduce((acc, sp) => {
                    if (sp.linkedProduct) {
                        // If there's a linked product, use linkedProduct.price if not null
                        return acc + (sp.linkedProduct.price ?? 0);
                    } else {
                        return acc + sp.price;
                    }
                }, 0);
                subCost = sumSubs * cartItem.quantity;
            }

            total += baseCost + subCost;
        }

        return total;
    }

    // 4) Provide everything to the context
    const value: CartContextValue = {
        items,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
        getItemCount,
        getCartTotal,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}
