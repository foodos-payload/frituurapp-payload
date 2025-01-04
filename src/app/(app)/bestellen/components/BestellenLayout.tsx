// File: /app/(app)/bestellen/components/BestellenLayout.tsx
'use client';

import React, { useState } from 'react';
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
type Product = {
    id: string;
    name_nl: string;
    name_en?: string;
    name_de?: string;
    name_fr?: string;
    price: number | null;
    image?: { url: string; alt: string };
    webdescription?: string;
    isPromotion?: boolean;
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

    return (
        <CartProvider>
            {/* LEFT-SIDE MENU DRAWER */}
            <MenuDrawer
                isOpen={showMenuDrawer}
                onClose={() => setShowMenuDrawer(false)}
                userLang={lang}
                onLangChange={(newLang) => setLang(newLang)}
            />

            {/* RIGHT-SIDE CART DRAWER */}
            <CartDrawer
                isOpen={showCartDrawer}
                onClose={() => setShowCartDrawer(false)}
                onEditItem={handleEditItem}
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
                />

                {/* DEBUG: Show JSON data of `categorizedProducts` */}
                <div className="mt-4 px-2">
                    <button
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                        onClick={() => setShowJsonModal(true)}
                    >
                        Show JSON
                    </button>
                </div>

                {/* The JSON modal overlay */}
                {showJsonModal && (
                    <div
                        className="
              fixed 
              inset-0 
              z-50
              flex 
              items-center 
              justify-center
              bg-black 
              bg-opacity-50
            "
                    >
                        <div className="relative w-11/12 max-w-3xl bg-white rounded shadow-lg p-6">
                            <button
                                className="absolute top-2 right-2 text-gray-600 hover:text-black"
                                onClick={() => setShowJsonModal(false)}
                            >
                                ✕
                            </button>
                            <h2 className="text-lg font-bold mb-2">Raw JSON from API</h2>
                            <div className="max-h-96 overflow-auto p-2 bg-gray-100 rounded text-sm">
                                <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(categorizedProducts, null, 2)}
                                </pre>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    onClick={() => setShowJsonModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating Cart Button (bottom-right) */}
                <CartButton onClick={() => setShowCartDrawer(true)} />
            </div>

            {/* PRODUCT POPUP for “Bewerken” if editingItem is set */}
            {editingProduct && editingItem && editingLineSignature && (
                <ProductPopupFlow
                    product={editingProduct}
                    editingItem={editingItem}             // Pass the existing cart item
                    editingItemSignature={editingLineSignature} // Pass the signature to be updated
                    onClose={handleCloseEditFlow}
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
