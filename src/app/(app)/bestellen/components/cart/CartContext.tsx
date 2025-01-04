// File: /app/(app)/bestellen/components/cart/CartContext.tsx
'use client';

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
 * The main item in your cart.
 */
export type CartItem = {
    productId: string;     // The main product's ID
    productName: string;   // e.g. product.name_nl
    price: number;         // The main product's base price
    quantity: number;      // How many
    note?: string;         // Optional user note
    image?: {
        url: string;
        alt?: string;
    } | null;

    // Subproduct choices:
    subproducts?: SubproductSelection[];

    hasPopups?: boolean;   // e.g. to show "Bewerken" button
    taxRate?: number;      // e.g. 6, 12, 21, etc.
};

/**
 * The shape of the entire CartContext, including operations.
 */
type CartContextValue = {
    items: CartItem[];

    /** Add a new line item or combine with existing if the "signature" matches. */
    addItem: (newItem: CartItem) => void;
    /** Update partial fields on an existing item (subproducts, note, price, etc.). */
    updateItem: (lineSignature: string, updates: Partial<CartItem>) => void;
    /** Change quantity of an item. If quantity goes to 0 => remove. */
    updateItemQuantity: (lineSignature: string, newQty: number) => void;
    /** Remove an item entirely by its "signature." */
    removeItem: (lineSignature: string) => void;
    /** Clear entire cart. */
    clearCart: () => void;

    getItemCount: () => number;
    getCartTotal: () => number;
};

/**
 * 1) React context
 */
const CartContext = createContext<CartContextValue | undefined>(undefined);

/**
 * 2) Hook to consume the cart
 */
export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

/**
 * 3) Utility: Create a unique "signature" string that
 *    differentiates line items by productId, subproducts, note, etc.
 */
export function getLineItemSignature(item: CartItem): string {
    // We'll gather an array of subproduct IDs (sorted to ensure consistent order):
    const subIds = item.subproducts?.map((sp) => sp.id).sort() || [];
    const notePart = item.note || ''; // or empty if none

    // Combine them into, e.g.: "prodId|[sub1,sub2]|note=someNote"
    // or you could JSON.stringify. Just ensure stable serialization.
    return `${item.productId}|[${subIds.join(',')}]|note=${notePart}`;
}

/**
 * 4) CartProvider: manages items & logic
 */
export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    /**
     * On mount, load from localStorage if available.
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
     * On every change, store in localStorage.
     */
    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(items));
    }, [items]);

    /**
     * 4A) addItem: If a line item with the *same signature* exists => increment quantity,
     * otherwise push as a separate line.
     */
    function addItem(newItem: CartItem) {
        const newSig = getLineItemSignature(newItem);

        setItems((prev) => {
            // Check if there's an existing line with same signature:
            const existingIndex = prev.findIndex(
                (i) => getLineItemSignature(i) === newSig
            );

            if (existingIndex >= 0) {
                // Found => combine quantity:
                return prev.map((i, idx) => {
                    if (idx === existingIndex) {
                        return {
                            ...i,
                            quantity: i.quantity + newItem.quantity,
                        };
                    }
                    return i;
                });
            } else {
                // No match => add as new line
                return [...prev, newItem];
            }
        });
    }

    /**
     * 4B) updateItem: partial updates to an existing line item.
     *     The user must pass the line "signature" from getLineItemSignature(...) 
     *     so we know which line is being updated.
     */
    function updateItem(lineSignature: string, updates: Partial<CartItem>) {
        setItems((prev) =>
            prev.map((item) => {
                const itemSig = getLineItemSignature(item);
                if (itemSig === lineSignature) {
                    // Merge partial updates. Possibly re-signature after subproduct changes:
                    const updated = { ...item, ...updates };

                    // If subproducts or note changed, we might need to re-check if a line with the new signature already exists:
                    const newSig = getLineItemSignature(updated);

                    if (newSig === itemSig) {
                        // The signature didn't effectively change => just update in place.
                        return updated;
                    } else {
                        // The signature changed => see if there's already a line with newSig, so we can combine them or keep separate.
                        // Here we do a two-step approach:
                        //  (1) We'll return updated (with the newSig) in place for now.
                        //  (2) Then below we could do a second pass to combine if needed.
                        return updated;
                    }
                }
                return item;
            })
        );

        // If you want to handle the scenario where an updated signature
        // now matches an existing item => you'd do a second pass or approach here.
    }

    /**
     * 4C) updateItemQuantity: If quantity=0 => remove line item.
     */
    function updateItemQuantity(lineSignature: string, newQty: number) {
        setItems((prev) =>
            prev
                .map((item) => {
                    const itemSig = getLineItemSignature(item);
                    if (itemSig === lineSignature) {
                        return { ...item, quantity: newQty };
                    }
                    return item;
                })
                .filter((item) => item.quantity > 0)
        );
    }

    /**
     * 4D) removeItem: just filter out that signature line.
     */
    function removeItem(lineSignature: string) {
        setItems((prev) =>
            prev.filter((item) => getLineItemSignature(item) !== lineSignature)
        );
    }

    /**
     * 4E) clearCart: remove all.
     */
    function clearCart() {
        setItems([]);
    }

    /**
     * 4F) getItemCount: sum quantity across all lines.
     */
    function getItemCount() {
        return items.reduce((sum, item) => sum + item.quantity, 0);
    }

    /**
     * 4G) getCartTotal: sum up base price + subproduct extras for each line, times quantity.
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
                        return acc + (sp.linkedProduct.price ?? 0);
                    }
                    return acc + sp.price;
                }, 0);

                subCost = sumSubs * cartItem.quantity;
            }

            total += baseCost + subCost;
        }
        return total;
    }

    /**
     * Provide context value
     */
    const value: CartContextValue = {
        items,
        addItem,
        updateItem,
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
