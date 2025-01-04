'use client'

import React, { useState, useEffect, useRef } from 'react'
import HorizontalCategories from './HorizontalCategories'
import VerticalCategories from './VerticalCategories'
import ProductCard from './ProductCard'
import ProductPopupFlow from './ProductPopupFlow'
import { useCart } from './cart/CartContext'

// Minimal data types
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
    // For your top categories:
    unfilteredCategories: Category[]
    // The search-filtered categories for main listing:
    filteredCategories: Category[]
    // If you want to use a language for picking text:
    userLang?: string
    // Called if the parent wants to do something on category-click (e.g. clear search).
    onCategoryClick?: (slug: string) => void
    // If the mobile search is open, you might adjust layout offset, etc.
    mobileSearchOpen?: boolean
}

/**
 * ProductList using an anchor-based approach:
 * - Each category section is <div id={"cat-"+slug}>.
 * - The categories in HorizontalCategories / VerticalCategories
 *   can link to `href="#cat-"+cat.slug`.
 * - We still maintain a small "activeCategory" logic (if you want to highlight).
 */
export default function ProductList({
    unfilteredCategories,
    filteredCategories,
    userLang,
    onCategoryClick,
    mobileSearchOpen = false,
}: Props) {
    // Keep track of which category is "active" (for highlight).
    const [activeCategory, setActiveCategory] = useState(
        unfilteredCategories[0]?.slug || ''
    )

    // Store the product currently in a popup flow.
    const [activeProduct, setActiveProduct] = useState<Product | null>(null)

    // Access the cart to add items.
    const { addItem } = useCart()

    // We can use an intersection observer or scroll listener to detect "active" section.
    // This is optional. If you don't need to highlight the active category while scrolling,
    // you can remove the code below. 
    useEffect(() => {
        // If we only want anchor navigation, we can skip the intersection logic.
        // But here's a minimal approach to highlight the category based on scroll.

        // 1) Grab all category sections that have an id="#cat-..."
        const sections = unfilteredCategories
            .map((cat) => document.getElementById(`cat-${cat.slug}`))
            .filter(Boolean) as HTMLElement[]

        // 2) We can create an observer to update "activeCategory" when a section is scrolled into view.
        const observer = new IntersectionObserver(
            (entries) => {
                // For each entry, if it's intersecting, setActiveCategory to that slug.
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // The id might be "cat-<slug>"
                        const slug = entry.target.id.replace('cat-', '')
                        setActiveCategory(slug)
                    }
                })
            },
            {
                root: null, // or some container if needed
                rootMargin: '-30% 0px -70% 0px',
                // This margin ensures the section is considered "active" 
                // when it's ~30% from top and not scrolled far below.
                threshold: 0.0,
            }
        )

        sections.forEach((sec) => observer.observe(sec))

        return () => {
            sections.forEach((sec) => observer.unobserve(sec))
            observer.disconnect()
        }
    }, [unfilteredCategories])

    /**
     * handleCategoryClick: called by Horizontal/Vertical categories 
     * if you want to do something (like clear search). 
     */
    function handleCategoryClick(slug: string) {
        // If parent wants to do something on category click (e.g. clearFilter).
        if (onCategoryClick) {
            onCategoryClick(slug)
        }
        // Also set activeCategory if you want immediate highlight:
        setActiveCategory(slug)
        // Note that the browser will do the actual anchor scroll for us.
    }

    /**
     * If a product has no popups, directly add it to cart.
     * If it has popups, set it as active to show the ProductPopupFlow.
     */
    function handleProductClick(prod: Product) {
        const popups = prod.productpopups || []
        const hasPopups = popups.some((p) => p.popup !== null)

        if (!hasPopups) {
            // Add direct to cart
            addItem({
                productId: prod.id,
                productName: prod.name_nl,
                price: prod.price || 0,
                quantity: 1,
            })
            alert(`Added "${prod.name_nl}" to cart!`)
        } else {
            // Show the popup flow
            setActiveProduct(prod)
        }
    }

    // Final array to render. (The parent has already done filtering.)
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
                {/* HORIZONTAL categories on small screens */}
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
                            <h3 className="categoryname text-xl mt-8 mb-4 font-secondary font-love-of-thunder">
                                {catLabel}
                            </h3>

                            {/* Grid with max 2 columns, plus responsive gap */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-1 md:gap-4 lg:gap-5">
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

/** Helpers */
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
