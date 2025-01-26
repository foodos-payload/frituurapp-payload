// File: /app/(app)/order/components/OrderLayout.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationsContext'
import ProductList from './ProductList';
import Header from './Header';
import {
    CartItem,
    getLineItemSignature, // <-- Make sure to export this from your CartContext
} from '../../../../context/CartContext';
import CartButton from './cart/CartButton';
import CartDrawer from './cart/CartDrawer';
import MenuDrawer from './menu/MenuDrawer';
import ProductPopupFlow from './ProductPopupFlow';
import '../order.css';
import { useShopBranding } from '@/context/ShopBrandingContext';
import { useSearchParams } from "next/navigation"; // <-- For reading "?kiosk=...&allergens=..."


/**
 * Minimal shape for a product in your categories.
 * (Add more fields if needed.)
 */
type Subproduct = {
    id: string;
    name_nl: string;
    price: number;
    tax?: number | null;
    tax_dinein?: number | null;
};

type PopupDoc = {
    id: string;
    popup_title_nl: string;
    multiselect: boolean;
    subproducts: Subproduct[];
};

type PopupItem = {
    order: number;
    popup: PopupDoc | null;
};

type Product = {
    id: string;
    name_nl: string;
    name_en?: string;
    name_fr?: string;
    name_de?: string;
    description_nl?: string;
    description_en?: string;
    description_fr?: string;
    description_de?: string;
    price: number | null;
    old_price: number | null;
    image?: { url: string; alt: string };
    webdescription?: string;
    isPromotion?: boolean;
    productpopups?: PopupItem[];
    tax?: number | null;
    tax_dinein?: number | null;
    allergens?: string[];
    // ...
};

type Category = {
    id: string;
    slug: string;
    name_nl: string;
    name_en?: string;
    name_de?: string;
    name_fr?: string;
    image?: { url: string; alt: string };
    products: Product[];
};

interface Props {
    shopSlug: string;
    categorizedProducts: Category[];
    userLocale?: string;
    /** Branding fetched from your /api/getBranding endpoint. */
}

/**
 * The main layout for “order”:
 * - Wraps everything in <CartProvider>.
 * - Renders a <Header>, <MenuDrawer>, <CartDrawer>.
 * - Renders <ProductList> with the filtered categories.
 */
export default function OrderLayout({
    shopSlug,
    categorizedProducts,
}: Props) {
    // 1) Grab the query string from the client side
    const searchParams = useSearchParams();
    const kioskParam = searchParams.get("kiosk"); // "true" or null
    const [allergensList, setAllergensList] = useState<string[]>([]);

    const isKiosk = kioskParam === "true";

    // If you want to do something with allergens in the client:

    useEffect(() => {
        const storedAllergens = localStorage.getItem("userAllergens");
        if (storedAllergens) {
            // e.g. "milk,nuts"
            const arr = storedAllergens
                .split(",")
                .map((a) => a.trim().toLowerCase())
                .filter(Boolean);
            setAllergensList(arr);
        }
    }, []);

    // 1) Create a callback to update both React state + localStorage
    function handleAllergensChange(newAllergens: string[]) {
        setAllergensList(newAllergens);

        if (newAllergens.length > 0) {
            localStorage.setItem("userAllergens", newAllergens.join(","));
        } else {
            localStorage.removeItem("userAllergens");
        }
    }

    const [allergensOpen, setAllergensOpen] = useState(false);


    const [showJsonModal, setShowJsonModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCartDrawer, setShowCartDrawer] = useState(false);
    const [showMenuDrawer, setShowMenuDrawer] = useState(false);
    const { locale } = useTranslation()

    // ***** NEW: Grab branding from the global provider  *****
    const branding = useShopBranding();

    // For mobile search toggle
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    // =========== “Edit item” popup flow state ===========
    const [editingItem, setEditingItem] = useState<CartItem | null>(null);
    const [editingLineSignature, setEditingLineSignature] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [activeProductFromList, setActiveProductFromList] = useState<Product | null>(null);


    //
    // ===================== CUSTOM POPSTATE HOOKS ======================
    //
    // 1) We'll watch for `popstate` events to close drawers/popups
    // 2) Whenever a drawer/popup opens, we push a new history entry
    //
    // 1) Single popstate effect to close any overlay
    useEffect(() => {
        function handlePopState() {
            // If the Cart Drawer is open, close it
            if (showCartDrawer) {
                setShowCartDrawer(false);
                window.history.pushState(null, "");
                return;
            }
            // If the Menu Drawer is open, close it
            if (showMenuDrawer) {
                setShowMenuDrawer(false);
                window.history.pushState(null, "");
                return;
            }
            // If the "Cart Edit" popup is open
            if (editingProduct) {
                setEditingItem(null);
                setEditingLineSignature(null);
                setEditingProduct(null);
                window.history.pushState(null, "");
                return;
            }
            // If the "ProductList" popup is open
            if (activeProductFromList) {
                setActiveProductFromList(null);
                window.history.pushState(null, "");
                return;
            }

            // Otherwise, do nothing => actual back navigation
        }

        // If ANY overlay is opened => push a history entry
        if (
            showCartDrawer ||
            showMenuDrawer ||
            editingProduct ||
            activeProductFromList
        ) {
            window.history.pushState(null, "");
        }

        window.addEventListener("popstate", handlePopState);
        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [
        showCartDrawer,
        showMenuDrawer,
        editingProduct,
        activeProductFromList,
    ]);

    // 2) Filter by searchTerm + allergens
    function filterCategories(categories: Category[]) {
        return categories.map((cat) => {
            const filteredProds = cat.products.filter((prod) => {

                // console.log("[Allergen Debug] Checking product:", prod.name_nl, prod.allergens);

                // a) Name-based search
                const productName = pickProductName(prod, locale).toLowerCase();
                const matchesSearchTerm = productName.includes(searchTerm.toLowerCase());

                // b) Allergen filter: exclude if product has ANY allergens in allergensList
                let hasConflictingAllergen = false;
                if (allergensList.length > 0 && prod.allergens) {
                    const productAllergens = prod.allergens.map((all) => all.toLowerCase());
                    hasConflictingAllergen = allergensList.some((all) =>
                        productAllergens.includes(all)
                    );
                }

                // Hide product if it has any of the userAllergens
                const passesAllergens = !hasConflictingAllergen;

                return matchesSearchTerm && passesAllergens;
            });

            return { ...cat, products: filteredProds };
        });
    }

    // 5) Apply your filter
    const filteredCategories = filterCategories(categorizedProducts);

    // 2) Keep only categories that have remaining products
    const visibleCategories = filteredCategories.filter(
        (cat) => cat.products.length > 0
    );

    // ======== Called by CartDrawer’s “Bewerken” button ========
    function handleEditItem(item: CartItem) {
        setEditingItem(item);

        // Generate and store the unique line signature for updating
        const lineSig = getLineItemSignature(item);
        setEditingLineSignature(lineSig);

        // Lookup the full product from original categories
        const foundProduct = findProductById(categorizedProducts, item.productId);
        if (foundProduct) {
            setEditingProduct(foundProduct);
        } else {
            console.warn('Could not find product in categories', item.productId);
            setEditingProduct(null);
        }

        // Optionally close the drawer
        setShowCartDrawer(false);
    }

    // Helper: find the product object by ID
    function findProductById(allCats: Category[], productId: string): Product | null {
        for (const cat of allCats) {
            for (const p of cat.products) {
                if (p.id === productId) return p;
            }
        }
        return null;
    }

    // Called when user finishes or cancels the “Bewerken” popup
    function handleCloseEditFlow() {
        setEditingItem(null);
        setEditingLineSignature(null);
        setEditingProduct(null);
    }

    function handleOpenPopupFlow(product: Product) {
        setActiveProductFromList(product);
    }

    const cartRef = useRef<HTMLDivElement>(null);

    return (
        <div>
            {/* LEFT-SIDE MENU DRAWER */}
            <MenuDrawer
                isOpen={showMenuDrawer}
                onClose={() => setShowMenuDrawer(false)}
                branding={branding}
            />

            {/* RIGHT-SIDE CART DRAWER */}
            <CartDrawer
                isOpen={showCartDrawer}
                onClose={() => setShowCartDrawer(false)}
                onEditItem={handleEditItem}
                branding={branding}
                isKiosk={isKiosk}
            />

            {/* MAIN LAYOUT CONTAINER */}
            <div
                className="
          main-container
          relative 
          flex 
          flex-col 
          h-screen 
          overflow-y-auto 
          overflow-x-hidden 
          w-full 
          scroll-smooth
        "
            >
                {/* Sticky Header */}
                <div className="sticky top-0 z-50 bg-white w-full">
                    <Header
                        searchValue={searchTerm}
                        onSearchChange={(val) => setSearchTerm(val)}
                        onClearFilter={() => setSearchTerm('')}
                        onMenuClick={() => setShowMenuDrawer(true)}
                        mobileSearchOpen={mobileSearchOpen}
                        setMobileSearchOpen={setMobileSearchOpen}
                        branding={branding}
                        isKiosk={isKiosk}
                        allergensList={allergensList}
                        onAllergensChange={handleAllergensChange}
                        onCategoryClick={() => {
                            // If user clicks a category in the UI, optionally reset the search
                            setMobileSearchOpen(false);
                        }}
                    />
                </div>

                {/* PRODUCT LIST */}
                <ProductList
                    unfilteredCategories={categorizedProducts}
                    filteredCategories={visibleCategories}
                    userLocale={locale}
                    mobileSearchOpen={mobileSearchOpen}
                    onCategoryClick={() => {
                        // If user clicks a category in the UI, optionally reset the search
                        setSearchTerm('');
                        setMobileSearchOpen(false);
                    }}
                    branding={branding}
                    cartRef={cartRef}
                    onOpenPopupFlow={handleOpenPopupFlow}
                    isKiosk={isKiosk}
                />

                {/* Floating Cart Button (bottom-right) */}
                <div ref={cartRef} style={{ position: 'relative', zIndex: 49 }}>
                    <CartButton onClick={() => setShowCartDrawer(true)} branding={branding} isKiosk={isKiosk} />
                </div>
            </div>

            {/* PRODUCT POPUP for “Bewerken” if editingItem is set */}
            {editingProduct && editingItem && editingLineSignature && (
                <ProductPopupFlow
                    product={editingProduct}
                    editingItem={editingItem}             // Pass the existing cart item
                    editingItemSignature={editingLineSignature} // Pass the signature to be updated
                    onClose={handleCloseEditFlow}
                    branding={branding}
                    cartRef={cartRef}
                    lang={locale}
                    isKiosk={isKiosk}
                />
            )}

            {/* If user opens popup from ProductList => ProductPopupFlow */}
            {activeProductFromList && (
                <ProductPopupFlow
                    product={activeProductFromList}
                    onClose={() => setActiveProductFromList(null)}
                    branding={branding}
                    cartRef={cartRef}
                    lang={locale}
                    isKiosk={isKiosk}
                />
            )}

        </div>
    );
}

/** Helper: pick product name in the chosen language. */
function pickProductName(prod: Product, locale: string) {
    switch (locale) {
        case 'en': return prod.name_en || prod.name_nl
        case 'fr': return prod.name_fr || prod.name_nl
        case 'de': return prod.name_de || prod.name_nl
        default: return prod.name_nl
    }
}