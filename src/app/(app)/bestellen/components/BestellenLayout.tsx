// File: /app/(app)/bestellen/components/BestellenLayout.tsx
'use client';

import React, { useState, useRef } from 'react';
import ProductList from './ProductList';
import Header from './Header';
import {
    CartProvider,
    CartItem,
    getLineItemSignature, // <-- Make sure to export this from your CartContext
} from './cart/CartContext';
import CartButton from './cart/CartButton';
import CartDrawer from './cart/CartDrawer';
import MenuDrawer from './menu/MenuDrawer';
import ProductPopupFlow from './ProductPopupFlow';
import '../bestellen.css';

/**
 * Minimal shape for a product in your categories.
 * (Add more fields if needed.)
 */
type Subproduct = {
    id: string;
    name_nl: string;
    price: number;
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
    // ...
};

type Category = {
    id: string;
    slug: string;
    name_nl: string;
    name_en?: string;
    name_de?: string;
    name_fr?: string;
    products: Product[];
};

interface Props {
    shopSlug: string;
    categorizedProducts: Category[];
    userLang?: string;
    /** Branding fetched from your /api/branding endpoint. */
    branding?: {
        /** URL-encoded absolute path to the site logo (optional). */
        logoUrl?: string;

        /** URL-encoded absolute path to an advertisement image for order status, etc. */
        adImage?: string;

        /** A site header background color in hex (e.g. "#0f1820"). */
        headerBackgroundColor?: string;

        /** A category-card background color in hex (e.g. "#ECAA02"). */
        categoryCardBgColor?: string;

        /** A primary CTA color in hex (used for "Add to Cart" or "Checkout" buttons). */
        primaryColorCTA?: string;

        siteTitle?: string;

    };
}

/**
 * The main layout for “Bestellen”:
 * - Wraps everything in <CartProvider>.
 * - Renders a <Header>, <MenuDrawer>, <CartDrawer>.
 * - Renders <ProductList> with the filtered categories.
 */
export default function BestellenLayout({
    shopSlug,
    categorizedProducts,
    userLang,
    branding,

}: Props) {
    const [showJsonModal, setShowJsonModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCartDrawer, setShowCartDrawer] = useState(false);
    const [showMenuDrawer, setShowMenuDrawer] = useState(false);

    // The user’s chosen language, defaulting to 'nl'
    const [lang, setLang] = useState(userLang || 'nl');

    // For mobile search toggle
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    // =========== “Edit item” popup flow state ===========
    const [editingItem, setEditingItem] = useState<CartItem | null>(null);
    const [editingLineSignature, setEditingLineSignature] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // 1) Filter each category’s products by `searchTerm`
    const filteredCategories = categorizedProducts.map((cat) => {
        const filteredProds = cat.products.filter((prod) => {
            const productName = pickProductName(prod, lang).toLowerCase();
            return productName.includes(searchTerm.toLowerCase());
        });
        return { ...cat, products: filteredProds };
    });

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

    const cartRef = useRef<HTMLDivElement>(null);

    return (
        <CartProvider>
            {/* LEFT-SIDE MENU DRAWER */}
            <MenuDrawer
                isOpen={showMenuDrawer}
                onClose={() => setShowMenuDrawer(false)}
                userLang={lang}
                onLangChange={(newLang) => setLang(newLang)}
                branding={branding}
            />

            {/* RIGHT-SIDE CART DRAWER */}
            <CartDrawer
                isOpen={showCartDrawer}
                onClose={() => setShowCartDrawer(false)}
                onEditItem={handleEditItem}
                branding={branding}
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
                    />
                </div>

                {/* PRODUCT LIST */}
                <ProductList
                    unfilteredCategories={categorizedProducts}
                    filteredCategories={visibleCategories}
                    userLang={lang}
                    mobileSearchOpen={mobileSearchOpen}
                    onCategoryClick={() => {
                        // If user clicks a category in the UI, optionally reset the search
                        setSearchTerm('');
                    }}
                    branding={branding}
                    cartRef={cartRef}
                />

                {/* Floating Cart Button (bottom-right) */}
                <div ref={cartRef} style={{ position: 'relative', zIndex: 49 }}>
                    <CartButton onClick={() => setShowCartDrawer(true)} branding={branding} />
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
                />
            )}
        </CartProvider>
    );
}

/** Helper: pick product name in the chosen language. */
function pickProductName(prod: Product, lang: string): string {
    switch (lang) {
        case 'en':
            return prod.name_en || prod.name_nl;
        case 'fr':
            return prod.name_fr || prod.name_nl;
        case 'de':
            return prod.name_de || prod.name_nl;
        default:
            return prod.name_nl;
    }
}
