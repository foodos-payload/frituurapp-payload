'use client'

import React, { useState, useEffect, useRef } from 'react'
import HorizontalCategories from './HorizontalCategories'
import VerticalCategories from './VerticalCategories'
import ProductCard from './ProductCard'
import ProductPopupFlow from './ProductPopupFlow'
import { useCart } from './cart/CartContext'

// Minimal data structures
type Subproduct = {
    id: string
    name_nl: string
    price: number
    // ...
}

type PopupDoc = {
    id: string
    popup_title_nl: string
    multiselect: boolean
    minimum_option: number
    maximum_option: number
    subproducts: Subproduct[]
}

type PopupItem = {
    order: number
    popup: PopupDoc | null
}

type Product = {
    id: string
    name_nl: string
    name_en?: string
    name_fr?: string
    name_de?: string
    description_nl?: string
    description_en?: string
    description_fr?: string
    description_de?: string
    price: number | null
    image?: { url: string; alt: string }
    webdescription?: string
    isPromotion?: boolean
    productpopups?: PopupItem[]
}

type Category = {
    id: string
    slug: string
    name_nl: string
    name_en?: string
    name_fr?: string
    name_de?: string
    products: Product[]
}

interface Props {
    /** The original, unfiltered categories for your menus. */
    unfilteredCategories: Category[]
    /** The search-filtered categories for the main listing. */
    filteredCategories: Category[]
    /** Current user language. */
    userLang?: string
    /** Called when a category is clicked (e.g., to clear the search). */
    onCategoryClick?: (slug: string) => void
    /** If the mobile search is open, might adjust layout offset, etc. */
    mobileSearchOpen?: boolean
}

/**
 * ProductList that uses anchor-based navigation:
 * - Each category section is <section id="cat-slug">.
 * - HorizontalCategories / VerticalCategories link to href="#cat-slug".
 * - We maintain an "activeCategory" highlight via IntersectionObserver.
 */
export default function ProductList({
    unfilteredCategories,
    filteredCategories,
    userLang,
    onCategoryClick,
    mobileSearchOpen = false,
}: Props) {
    const [activeCategory, setActiveCategory] = useState(() => {
        return unfilteredCategories[0]?.slug || ''
    })
    const [activeProduct, setActiveProduct] = useState<Product | null>(null)

    const { addItem } = useCart()
    const observerRef = useRef<IntersectionObserver | null>(null)

    // ===== Set up IntersectionObserver to highlight active category =====
    useEffect(() => {
        // 1) Grab all category <section id="cat-slug"> elements
        const sections = unfilteredCategories
            .map((cat) => document.getElementById(`cat-${cat.slug}`))
            .filter(Boolean) as HTMLElement[]

        // 2) Create observer
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const slug = entry.target.id.replace('cat-', '')
                        setActiveCategory(slug)
                    }
                })
            },
            {
                root: null,
                rootMargin: '-30% 0px -70% 0px',
                threshold: 0.0,
            }
        )
        observerRef.current = obs

        // 3) Observe all sections
        sections.forEach((sec) => obs.observe(sec))

        return () => {
            // Cleanup
            sections.forEach((sec) => obs.unobserve(sec))
            obs.disconnect()
        }
    }, [unfilteredCategories])

    // Helper to reattach observer after a category jump
    function reconnectObserver() {
        const sections = unfilteredCategories
            .map((cat) => document.getElementById(`cat-${cat.slug}`))
            .filter(Boolean) as HTMLElement[]
        sections.forEach((sec) => observerRef.current?.observe(sec))
    }

    // ===== If user clicks a category in Horizontal/Vertical menus =====
    function handleCategoryClick(slug: string) {
        // If the parent wants to do something else (e.g. clear search), call it:
        if (onCategoryClick) onCategoryClick(slug)

        // 1) Temporarily stop IntersectionObserver from overriding our highlight
        observerRef.current?.disconnect()

        // 2) Immediately set highlight
        setActiveCategory(slug)

        // 3) The <a> link will do normal anchor jump => no preventDefault
        // 4) Wait 800ms, then reconnect
        setTimeout(() => {
            observerRef.current && reconnectObserver()
        }, 800)
    }

    // ===== If user clicks product or plus icon =====
    function handleProductClick(prod: Product) {
        const popups = prod.productpopups || []
        const hasPopups = popups.some((p) => p.popup !== null)

        // If no popups => directly add to cart
        if (!hasPopups) {
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
            })
            // alert(`Added "${prod.name_nl}" to cart!`)
        } else {
            // Otherwise => open the popup flow
            setActiveProduct(prod)
        }
    }

    // Only keep categories that have products after filtering
    const visibleSections = filteredCategories

    return (
        <div className="flex gap-4 w-full p-2 scroll-smooth">
            {/* LEFT: vertical categories on large screens */}
            <div
                className="hidden lg:block"
                style={{
                    width: '240px',
                    flexShrink: 0,
                    position: 'sticky',
                    top: '100px',
                    alignSelf: 'flex-start',
                    height: '70vh',
                    overflow: 'auto',
                    background: '#f9f9f9',
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
                />
            </div>

            {/* MAIN COLUMN */}
            <div className="flex-grow w-full">
                {/* Horizontal categories on small screens */}
                <div
                    className="block lg:hidden w-full bg-white overflow-auto"
                    style={{
                        marginBottom: '1rem',
                        position: 'sticky',
                        top: mobileSearchOpen ? 120 : 80,
                        zIndex: 50,
                        background: '#fff',
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
                    />
                </div>

                {/* CATEGORY SECTIONS */}
                {visibleSections.map((cat) => {
                    const catLabel = pickCategoryName(cat, userLang)

                    return (
                        <section
                            key={cat.id}
                            id={`cat-${cat.slug}`}
                            className="scroll-mt-[100px] mb-8"
                        >
                            <h3 className="categoryname text-xl mt-3 mb-4 font-secondary font-love-of-thunder">
                                {catLabel}
                            </h3>

                            {/* Grid with max 2 columns, plus responsive gap */}
                            <div className="grid grid-cols-1 md:grid-cols-2 items-stretch gap-4">
                                {cat.products.map((prod) => {
                                    // Build local display fields
                                    const displayName = pickProductName(prod, userLang)
                                    const displayDesc = pickDescription(prod, userLang)
                                    const popups = prod.productpopups || []
                                    const hasPopups = popups.some((p) => p.popup !== null)

                                    return (
                                        <ProductCard
                                            key={prod.id}
                                            product={{
                                                ...prod, // includes isPromotion, image, etc.
                                                displayName,
                                                displayDesc,
                                            }}
                                            // If product has no popups => we do the add-to-cart spinner
                                            // If product does have popups => we skip the spinner & open popup instead
                                            shouldShowSpinner={!hasPopups} // only show spinner if no popups
                                            handleAction={() => handleProductClick(prod)}
                                        />
                                    )
                                })}
                            </div>
                        </section>
                    )
                })}

                {/* If no categories remain after filtering */}
                {visibleSections.length === 0 && (
                    <div className="mt-8">
                        <h2>No products match your search.</h2>
                    </div>
                )}
            </div>

            {/* PRODUCT POPUP FLOW */}
            {activeProduct && (
                <ProductPopupFlow
                    product={activeProduct}
                    onClose={() => setActiveProduct(null)}
                />
            )}
        </div>
    )
}

/** Helper to pick category name in the correct language */
function pickCategoryName(cat: Category, lang?: string): string {
    switch (lang) {
        case 'en':
            return cat.name_en || cat.name_nl
        case 'fr':
            return cat.name_fr || cat.name_nl
        case 'de':
            return cat.name_de || cat.name_nl
        default:
            return cat.name_nl
    }
}

/** Helper to pick product name in correct language */
function pickProductName(prod: Product, lang?: string): string {
    switch (lang) {
        case 'en':
            return prod.name_en || prod.name_nl
        case 'fr':
            return prod.name_fr || prod.name_nl
        case 'de':
            return prod.name_de || prod.name_nl
        default:
            return prod.name_nl
    }
}

/** Helper to pick product description in correct language */
function pickDescription(prod: Product, lang?: string): string | undefined {
    switch (lang) {
        case 'en':
            return prod.description_en || prod.description_nl
        case 'fr':
            return prod.description_fr || prod.description_nl
        case 'de':
            return prod.description_de || prod.description_nl
        default:
            return prod.description_nl
    }
}
