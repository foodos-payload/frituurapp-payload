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
    const [activeCategory, setActiveCategory] = useState(
        unfilteredCategories[0]?.slug || ''
    )
    const [activeProduct, setActiveProduct] = useState<Product | null>(null)

    const { addItem } = useCart()

    // We'll store the IntersectionObserver instance in a ref
    const observerRef = useRef<IntersectionObserver | null>(null)

    // IntersectionObserver setup
    useEffect(() => {
        // Gather section elements
        const sections = unfilteredCategories
            .map((cat) => document.getElementById(`cat-${cat.slug}`))
            .filter(Boolean) as HTMLElement[]

        // Create the observer
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

        // Observe each section
        sections.forEach((sec) => obs.observe(sec))

        return () => {
            sections.forEach((sec) => obs.unobserve(sec))
            obs.disconnect()
        }
    }, [unfilteredCategories])

    // A helper to re-observe
    function reconnectObserver() {
        const sections = unfilteredCategories
            .map((cat) => document.getElementById(`cat-${cat.slug}`))
            .filter(Boolean) as HTMLElement[]
        sections.forEach((sec) => observerRef.current?.observe(sec))
    }

    // Called by HorizontalCategories
    function handleCategoryClick(slug: string) {
        // If you need to do something else (like clear searchTerm), you can do it here:
        if (onCategoryClick) onCategoryClick(slug)

        // 1) Disconnect observer so it doesn't override
        observerRef.current?.disconnect()

        // 2) We can also setActiveCategory for immediate highlight
        setActiveCategory(slug)

        // 3) The <a> link in HorizontalCategories will do a normal anchor jump
        //    because we do not preventDefault.

        // 4) After 800ms, reconnect
        setTimeout(() => {
            observerRef.current && reconnectObserver()
        }, 800)
    }

    function handleProductClick(prod: Product) {
        const popups = prod.productpopups || []
        const hasPopups = popups.some((p) => p.popup !== null)

        if (!hasPopups) {
            addItem({
                productId: prod.id,
                productName: prod.name_nl,
                price: prod.price || 0,
                quantity: 1,
            })
            alert(`Added "${prod.name_nl}" to cart!`)
        } else {
            setActiveProduct(prod)
        }
    }

    // The final “visible” categories after filtering
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
                            <h3 className="categoryname text-xl mt-3 mb-4 font-secondary font-love-of-thunder">
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
