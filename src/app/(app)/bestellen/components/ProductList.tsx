// File: /app/(app)/bestellen/components/ProductList.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import HorizontalCategories from "./HorizontalCategories";
import VerticalCategories from "./VerticalCategories";
import ProductCard from "./ProductCard";
import ProductPopupFlow from "./ProductPopupFlow";
import { useCart } from "./cart/CartContext";

/**
 * Minimal data structures
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
};

type Category = {
    id: string;
    slug: string;
    name_nl: string;
    name_en?: string;
    name_fr?: string;
    name_de?: string;
    products: Product[];
};

type Branding = {
    categoryCardBgColor?: string;
    primaryColorCTA?: string;
    // ...
};

interface Props {
    /** The original, unfiltered categories for your menus. */
    unfilteredCategories: Category[];
    /** The search-filtered categories for the main listing. */
    filteredCategories: Category[];
    /** Current user language. */
    userLang?: string;
    /** Called when a category is clicked (e.g., to clear the search). */
    onCategoryClick?: (slug: string) => void;
    /** If the mobile search is open, might adjust layout offset, etc. */
    mobileSearchOpen?: boolean;

    branding?: Branding;

    /** The cart DOM ref, so we can measure its position. */
    cartRef?: React.RefObject<HTMLDivElement>;
}


/**
 * ProductList that uses anchor-based navigation plus "fly" animations
 * only for the no-popup case (direct add).
 * If product has popups => open popup, wait for "product-added" event.
 */
export default function ProductList({
    unfilteredCategories,
    filteredCategories,
    userLang,
    onCategoryClick,
    mobileSearchOpen = false,
    branding,
    cartRef,
}: Props) {
    const [activeCategory, setActiveCategory] = useState(
        () => unfilteredCategories[0]?.slug || ""
    );
    const [activeProduct, setActiveProduct] = useState<Product | null>(null);

    const { addItem } = useCart();
    const observerRef = useRef<IntersectionObserver | null>(null);

    // A map of product ID => ref
    const productRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});

    // create or retrieve a ref for each product
    function getOrCreateProductRef(productId: string) {
        if (!productRefs.current[productId]) {
            productRefs.current[productId] = React.createRef<HTMLDivElement>();
        }
        return productRefs.current[productId];
    }

    // === IntersectionObserver to highlight active category
    useEffect(() => {
        const sections = filteredCategories
            .map((cat) => document.getElementById(`cat-${cat.slug}`))
            .filter(Boolean) as HTMLElement[];

        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const slug = entry.target.id.replace("cat-", "");
                        setActiveCategory(slug);
                    }
                });
            },
            {
                root: null,
                rootMargin: "0px 0px -50% 0px",
                threshold: 0.0,
            }
        );

        observerRef.current = obs;
        sections.forEach((sec) => obs.observe(sec));

        return () => {
            sections.forEach((sec) => obs.unobserve(sec));
            obs.disconnect();
        };
    }, [filteredCategories]);

    function reconnectObserver() {
        const sections = unfilteredCategories
            .map((cat) => document.getElementById(`cat-${cat.slug}`))
            .filter(Boolean) as HTMLElement[];
        sections.forEach((sec) => observerRef.current?.observe(sec));
    }

    function handleCategoryClick(slug: string) {
        onCategoryClick?.(slug);
        observerRef.current?.disconnect();
        setActiveCategory(slug);
        setTimeout(() => {
            observerRef.current && reconnectObserver();
        }, 800);
    }

    // === Listen for "product-added" event from ProductPopupFlow
    useEffect(() => {
        function onProductAdded(e: Event) {
            const custom = e as CustomEvent<{ productId: string; imageUrl?: string }>;
            const { productId } = custom.detail;

            // find the cardEl
            const cardRef = productRefs.current[productId]?.current;
            // find the cart DOM => we must check if cartRef is defined
            if (!cardRef || !cartRef?.current) return;

            flyFromCardToCart(cardRef, cartRef.current);
        }

        window.addEventListener("product-added", onProductAdded);
        return () => {
            window.removeEventListener("product-added", onProductAdded);
        };
    }, [cartRef]);

    /**
 * Animate a cloned <img> from the product card to the cart icon center.
 * We'll call this from the "product-added" event or a direct click event.
 */
    function flyFromCardToCart(cardEl: HTMLDivElement, cartContainerEl: HTMLDivElement) {
        // 1) Find the .product-img inside the card
        const imgEl = cardEl.querySelector<HTMLImageElement>(".product-img");
        if (!imgEl) return;

        // 2) Clone the image
        const flyingImg = imgEl.cloneNode(true) as HTMLImageElement;
        flyingImg.style.position = "absolute";
        flyingImg.style.zIndex = "9999";

        // 3) Measure the original image bounding rect + scroll offset
        const rect = imgEl.getBoundingClientRect();
        const scrollX = window.scrollX || 0;
        const scrollY = window.scrollY || 0;

        // 4) Apply the starting width, height, left, top
        flyingImg.style.width = `${rect.width}px`;
        flyingImg.style.height = `${rect.height}px`;
        flyingImg.style.left = `${rect.left + scrollX}px`;
        flyingImg.style.top = `${rect.top + scrollY}px`;

        // 5) Define transition + append to DOM
        flyingImg.style.transition = "transform 1s ease-in-out, opacity 1s ease-in-out";
        document.body.appendChild(flyingImg);

        // 6) Check if there’s a child element with .cart-icon, or fallback to cartContainerEl
        const cartIconEl = cartContainerEl.querySelector<HTMLElement>(".cart-icon");
        const targetRect = cartIconEl
            ? cartIconEl.getBoundingClientRect()
            : cartContainerEl.getBoundingClientRect();

        // 7) Next animation frame => apply final transform
        requestAnimationFrame(() => {
            const flyingRect = flyingImg.getBoundingClientRect();
            const deltaX =
                targetRect.left + targetRect.width / 2 - (flyingRect.left + flyingRect.width / 2);
            const deltaY =
                targetRect.top + targetRect.height / 2 - (flyingRect.top + flyingRect.height / 2);

            flyingImg.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.1)`;
            flyingImg.style.opacity = "0.3";
        });

        // 5) Remove after animation
        setTimeout(() => {
            flyingImg.remove();

            // 6) Wiggle/pulse the .cart-icon
            const iconEl = document.querySelector('.cart-icon') as HTMLElement | null;
            if (iconEl) {
                // Add the wiggle (or pulse) class
                iconEl.classList.add('cart-wiggle');

                // Remove it after 800ms (so it can re-trigger again next time)
                setTimeout(() => {
                    iconEl.classList.remove('cart-wiggle');
                }, 800);
            }
        }, 1000);
    }

    // === If user clicks a product or plus icon
    function handleProductClick(prod: Product) {
        const popups = prod.productpopups || [];
        const hasPopups = popups.some((p) => p.popup !== null);

        if (!hasPopups) {
            // No popups => directly add to cart, which triggers immediate local animation in the ProductCard
            addItem({
                productId: prod.id,
                productName: prod.name_nl,
                price: prod.price || 0,
                quantity: 1,
                image: prod.image
                    ? {
                        url: prod.image.url,
                        alt: prod.image.alt ?? prod.name_nl,
                    }
                    : undefined,
            });
            // We let ProductCard do the local spinner / fly on click.
        } else {
            // Has popups => open the popup flow. Wait for "Bevestigen" => that triggers 'product-added' event.
            setActiveProduct(prod);
        }
    }

    // The final, visible categories
    const visibleSections = filteredCategories;

    return (
        <div className="flex gap-4 w-full p-2 scroll-smooth containercustommaxwidth">
            {/* LEFT: vertical categories on large screens */}
            <div
                className="hidden lg:block"
                style={{
                    width: "240px",
                    flexShrink: 0,
                    position: "sticky",
                    top: "100px",
                    alignSelf: "flex-start",
                    height: "70vh",
                    overflow: "auto",
                    background: "#f9f9f9",
                }}
            >
                <VerticalCategories
                    categories={unfilteredCategories.map((cat) => ({
                        id: cat.id,
                        slug: cat.slug,
                        label: pickCategoryName(cat, userLang),
                    }))}
                    activeCategory={activeCategory}
                    onCategoryClick={handleCategoryClick}
                    branding={branding}
                />
            </div>

            {/* MAIN COLUMN */}
            <div className="flex-grow w-full">
                {/* Horizontal categories on small screens */}
                <div
                    className="block lg:hidden w-full bg-white overflow-auto"
                    style={{
                        marginBottom: "1rem",
                        position: "sticky",
                        top: mobileSearchOpen ? 120 : 80,
                        zIndex: 50,
                        background: "#fff",
                    }}
                >
                    <HorizontalCategories
                        categories={unfilteredCategories.map((cat) => ({
                            id: cat.id,
                            slug: cat.slug,
                            label: pickCategoryName(cat, userLang),
                        }))}
                        activeCategory={activeCategory}
                        onCategoryClick={handleCategoryClick}
                        branding={branding}
                    />
                </div>

                {/* CATEGORY SECTIONS */}
                {visibleSections.map((cat) => {
                    const catLabel = pickCategoryName(cat, userLang);

                    return (
                        <section key={cat.id} id={`cat-${cat.slug}`} className="scroll-mt-[100px] mb-8">
                            <h3 className="categoryname text-xl mt-3 mb-4 font-secondary font-love-of-thunder">
                                {catLabel}
                            </h3>

                            {/* Grid with max 2 columns */}
                            <div className="grid grid-cols-1 md:grid-cols-2 items-stretch gap-4">
                                {cat.products.map((prod) => {
                                    // build local display fields
                                    const displayName = pickProductName(prod, userLang);
                                    const displayDesc = pickDescription(prod, userLang);

                                    // create or retrieve the ref for this product
                                    const productRef = getOrCreateProductRef(prod.id);

                                    // Check if product has popups
                                    const popups = prod.productpopups || [];
                                    const hasPopups = popups.some((p) => p.popup !== null);

                                    return (
                                        <ProductCard
                                            key={prod.id}
                                            product={{
                                                ...prod,
                                                displayName,
                                                displayDesc,
                                            }}
                                            // We only show local spinner if NO popups
                                            shouldShowSpinner={!hasPopups}
                                            handleAction={() => handleProductClick(prod)}
                                            branding={branding}
                                            cartRef={cartRef}
                                            productRef={productRef}
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}

                {/* No categories after filtering */}
                {visibleSections.length === 0 && (
                    <div className="mt-8">
                        <h2>No products match your search.</h2>
                    </div>
                )}
            </div>

            {/* If a popup is opened */}
            {activeProduct && (
                <ProductPopupFlow
                    product={activeProduct}
                    onClose={() => setActiveProduct(null)}
                    branding={branding}
                    cartRef={cartRef}
                />
            )}
        </div>
    );
}

/** Helper to pick category name in the correct language */
function pickCategoryName(cat: Category, lang?: string): string {
    switch (lang) {
        case "en":
            return cat.name_en || cat.name_nl;
        case "fr":
            return cat.name_fr || cat.name_nl;
        case "de":
            return cat.name_de || cat.name_nl;
        default:
            return cat.name_nl;
    }
}

/** Helper to pick product name in correct language */
function pickProductName(prod: Product, lang?: string): string {
    switch (lang) {
        case "en":
            return prod.name_en || prod.name_nl;
        case "fr":
            return prod.name_fr || prod.name_nl;
        case "de":
            return prod.name_de || prod.name_nl;
        default:
            return prod.name_nl;
    }
}

/** Helper to pick product description in correct language */
function pickDescription(prod: Product, lang?: string): string | undefined {
    switch (lang) {
        case "en":
            return prod.description_en || prod.description_nl;
        case "fr":
            return prod.description_fr || prod.description_nl;
        case "de":
            return prod.description_de || prod.description_nl;
        default:
            return prod.description_nl;
    }
}
