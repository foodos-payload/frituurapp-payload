// File: /app/(app)/bestellen/components/ProductList.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import HorizontalCategories from './HorizontalCategories'
import VerticalCategories from './VerticalCategories'
import ProductCard from './ProductCard'
import ProductPopupFlow from './ProductPopupFlow'
import { useCart } from './cart/CartContext'

// Example data types (simplified for clarity)
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
    /** The search-filtered categories for the main product listing. */
    filteredCategories: Category[]
    /** Current user language. */
    userLang?: string
    /**
     * If the parent wants to do something (like clearing the search) when a category is clicked,
     * we can call this callback.
     */
    onCategoryClick?: (slug: string) => void
}

export default function ProductList({
    unfilteredCategories,
    filteredCategories,
    userLang,
    onCategoryClick,
}: Props) {
    // We'll default to the first unfiltered category as "active".
    const [activeCategory, setActiveCategory] = useState(() => {
        return unfilteredCategories[0]?.slug || ''
    })

    // If user clicks a product, we store it here to show the popup flow.
    const [activeProduct, setActiveProduct] = useState<Product | null>(null)

    // categoryRefs to track DOM positions of each category for scrolling logic
    const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})

    // If we're scrolling programmatically, ignore scroll events that set activeCategory.
    const [programmaticScroll, setProgrammaticScroll] = useState(false)

    // Access the cart
    const { addItem } = useCart()

    // ===== Scroll listener: updates activeCategory based on scroll position =====
    // ===== SCROLL LISTENER: update activeCategory as user scrolls =====
    useEffect(() => {
        function handleScroll() {
            if (programmaticScroll) return
            if (unfilteredCategories.length === 0) return

            const headerOffset = 200
            const scrollY = window.scrollY + headerOffset

            let bestSlug = ''
            let bestDist = Number.MAX_VALUE

            for (const cat of unfilteredCategories) {
                const el = categoryRefs.current[cat.slug]
                if (!el) continue

                const offsetTop = el.offsetTop
                const dist = Math.abs(offsetTop - scrollY)
                if (dist < bestDist) {
                    bestDist = dist
                    bestSlug = cat.slug
                }
            }

            if (bestSlug && bestSlug !== activeCategory) {
                setActiveCategory(bestSlug)
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [unfilteredCategories, activeCategory, programmaticScroll])

    // ===== Called when user clicks a category in a menu =====
    // ===== USER CLICKS A CATEGORY FROM THE MENU =====
    function handleCategoryClick(slug: string) {
        setProgrammaticScroll(true)

        // 1) If we are currently filtering out that category (meaning it's not in filteredCategories),
        //    we need to let the parent remove the filter first, then wait a bit, then scroll.
        const isCategoryFilteredOut = !filteredCategories.some((cat) => cat.slug === slug)

        if (isCategoryFilteredOut) {
            // The parent can do something like setSearchTerm('') in onCategoryClick
            if (onCategoryClick) {
                onCategoryClick(slug)
            }

            // Then we wait a short time for the parent's re-render (the filter is cleared => category is visible).
            setTimeout(() => {
                scrollToCategory(slug)
            }, 300)
        } else {
            // Otherwise, we can scroll immediately
            if (onCategoryClick) {
                onCategoryClick(slug)
            }
            scrollToCategory(slug)
        }
    }

    // Helper to actually do the smooth-scroll
    function scrollToCategory(slug: string) {
        const el = categoryRefs.current[slug]
        if (el) {
            el.scrollIntoView({
                behavior: 'smooth',
                block: 'start', // We'll rely on scroll-margin-top to handle the offset
            })
        }
        setActiveCategory(slug)

        setTimeout(() => {
            setProgrammaticScroll(false)
        }, 600)
    }


    //--------------------------------------------
    // 3) Product Click => open flow if popups, else add directly
    //--------------------------------------------
    function handleProductClick(prod: Product) {
        const popups = prod.productpopups || []
        // Does it have any non-null popups?
        const hasPopups = popups.some((p) => p.popup !== null)

        if (!hasPopups) {
            // No popups => add directly to cart with quantity=1, no subproducts
            addItem({
                productId: prod.id,
                productName: prod.name_nl,
                price: prod.price || 0,
                quantity: 1,
                // If you want to store more fields from `prod` (like image?), do so:
                // image: prod.image ? { ... } : undefined,
            })
            alert(`Added "${prod.name_nl}" to cart!`)
        } else {
            // If productpopups exist, open the flow
            setActiveProduct(prod)
        }
    }

    // ===== 1) Build the category list for menus (using unfiltered categories) =====
    const menuCategories = unfilteredCategories.map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        label: pickCategoryName(cat, userLang),
    }))

    // ===== 2) Build the category sections for main listing (using filtered categories) =====
    // In Option B, the parent has already removed categories with 0 products if desired.
    // So here, we can just use "filteredCategories" as the final list.
    // But if you want to hide categories that are truly empty:
    const visibleSections = filteredCategories

    return (
        <div style={{ display: 'flex', gap: '1rem' }}>
            {/* LEFT: vertical categories on large screens */}
            <div
                className="hidden lg:block"
                style={{
                    width: '240px',
                    flexShrink: 0,
                    position: 'sticky',
                    top: '80px',
                    alignSelf: 'flex-start',
                    height: '70vh',
                    overflow: 'auto',
                    background: '#f9f9f9',
                }}
            >
                <VerticalCategories
                    categories={menuCategories}
                    activeCategory={activeCategory}
                    onCategoryClick={handleCategoryClick}
                />
            </div>

            {/* MAIN COLUMN */}
            <div style={{ flexGrow: 1 }}>
                {/* HORIZONTAL categories on small screens */}
                <div
                    className="block lg:hidden"
                    style={{
                        marginBottom: '1rem',
                        position: 'sticky',
                        top: 80,
                        zIndex: 50,
                        background: '#fff',
                    }}
                >
                    <HorizontalCategories
                        categories={menuCategories}
                        activeCategory={activeCategory}
                        onCategoryClick={handleCategoryClick}
                    />
                </div>

                {/* CATEGORY SECTIONS: map over your "filtered" array */}
                {visibleSections.map((cat) => {
                    const catLabel = pickCategoryName(cat, userLang)
                    return (
                        <div
                            key={cat.id}
                            id={cat.slug}
                            ref={(el) => {
                                categoryRefs.current[cat.slug] = el
                            }}
                            className="scroll-mt-[100px]" // Or "scroll-mt-24" if you want Tailwind scale
                            style={{ marginBottom: '2rem' }}
                        >
                            <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                                {catLabel}
                            </h3>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {cat.products.map((prod) => {
                                    const displayName = pickProductName(prod, userLang)
                                    const displayDesc = pickDescription(prod, userLang)

                                    return (
                                        <ProductCard
                                            key={prod.id}
                                            product={{
                                                ...prod,
                                                displayName,
                                                displayDesc,
                                            }}
                                            onClick={() => handleProductClick(prod)}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}

                {/* If no categories remain after filtering */}
                {visibleSections.length === 0 && (
                    <div style={{ marginTop: '2rem' }}>
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

/** Helpers for picking localized text. */
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

function pickProductName(p: Product, lang?: string): string {
    switch (lang) {
        case 'en':
            return p.name_en || p.name_nl
        case 'fr':
            return p.name_fr || p.name_nl
        case 'de':
            return p.name_de || p.name_nl
        default:
            return p.name_nl
    }
}

function pickDescription(p: Product, lang?: string): string | undefined {
    switch (lang) {
        case 'en':
            return p.description_en || p.description_nl
        case 'fr':
            return p.description_fr || p.description_nl
        case 'de':
            return p.description_de || p.description_nl
        default:
            return p.description_nl
    }
}
