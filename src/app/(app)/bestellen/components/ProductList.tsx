'use client'

import React, { useEffect, useRef, useState } from 'react'
import HorizontalCategories from './HorizontalCategories'
import VerticalCategories from './VerticalCategories'
import ProductCard from './ProductCard'

/** Example data types **/
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

type Props = {
    categorizedProducts: Category[]
    userLang?: string
}

/**
 * ProductList with:
 * - Sticky vertical categories on large screens
 * - Sticky horizontal categories on smaller screens
 * - A scroll listener that finds which category is "closest to top" and marks it active,
 *   but ignores scroll events briefly after a user clicks a category.
 */
export default function ProductList({ categorizedProducts, userLang }: Props) {
    // Keep track of which category is "active".
    const [activeCategory, setActiveCategory] = useState(() => {
        const firstSlug = categorizedProducts[0]?.slug || ''
        console.log('[ProductList] Initial activeCategory:', firstSlug)
        return firstSlug
    })

    // Refs for each category’s container <div>.
    const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})

    // A boolean that indicates "programmatic scrolling" (so the scroll event doesn’t override it).
    const [programmaticScroll, setProgrammaticScroll] = useState(false)

    useEffect(() => {
        console.log('[ProductList] useEffect() - set up scroll listener')

        function handleScroll() {
            // If we're currently programmatically scrolling, ignore
            if (programmaticScroll) return
            if (categorizedProducts.length === 0) return

            const headerOffset = 80 // e.g., sticky header height
            const scrollY = window.scrollY + headerOffset

            let bestSlug = ''
            let bestDist = Number.MAX_VALUE

            for (const cat of categorizedProducts) {
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
                console.log('[ProductList] handleScroll => setActiveCategory:', bestSlug)
                setActiveCategory(bestSlug)
            }
        }

        // Attach the event listener
        window.addEventListener('scroll', handleScroll, { passive: true })

        return () => {
            console.log('[ProductList] useEffect cleanup - remove scroll listener')
            window.removeEventListener('scroll', handleScroll)
        }
    }, [categorizedProducts, activeCategory, programmaticScroll])

    /**
     * On category menu click:
     *   - set `programmaticScroll = true`,
     *   - scrollIntoView,
     *   - set active category immediately,
     *   - after ~600ms, set `programmaticScroll = false`.
     */
    function handleCategoryClick(slug: string) {
        console.log('[ProductList] handleCategoryClick => user clicked:', slug)
        setProgrammaticScroll(true)

        const el = categoryRefs.current[slug]
        if (el) {
            console.log(`[handleCategoryClick] calling scrollIntoView for slug=${slug}`)
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }

        setActiveCategory(slug)

        // Wait a little while for the smooth-scroll to finish
        setTimeout(() => {
            setProgrammaticScroll(false)
        }, 600)
    }

    return (
        <div style={{ display: 'flex', gap: '1rem' }}>
            {/* 
        -- VERTICAL CATEGORIES on large screens --
        We'll make it sticky by applying Tailwind classes (or inline styles).
        Example: `position: sticky; top: 0;`
      */}
            <div
                className="hidden lg:block"
                style={{
                    width: '240px',
                    flexShrink: 0,
                    position: 'sticky',
                    top: '0', // or top: '80px' if your header is 80px tall
                    alignSelf: 'flex-start',
                    height: '100vh', // you can adjust
                    overflow: 'auto',
                    background: '#f9f9f9',
                }}
            >
                <VerticalCategories
                    categories={categorizedProducts.map((cat) => ({
                        id: cat.id,
                        slug: cat.slug,
                        label: pickCategoryName(cat, userLang),
                    }))}
                    activeCategory={activeCategory}
                    onCategoryClick={handleCategoryClick}
                />
            </div>

            {/* MAIN PRODUCT AREA */}
            <div style={{ flexGrow: 1 }}>
                {/* 
          -- HORIZONTAL CATEGORIES on small screens --
          Make it sticky as well. Typically you'd do something like:
          `position: sticky; top: 0; z-index: 50; background: white;`
        */}
                <div
                    className="block lg:hidden"
                    style={{
                        marginBottom: '1rem',
                        position: 'sticky',
                        top: 0,
                        zIndex: 50,
                        background: '#fff',
                    }}
                >
                    <HorizontalCategories
                        categories={categorizedProducts.map((cat) => ({
                            id: cat.id,
                            slug: cat.slug,
                            label: pickCategoryName(cat, userLang),
                        }))}
                        activeCategory={activeCategory}
                        onCategoryClick={handleCategoryClick}
                    />
                </div>

                {/* CATEGORY SECTIONS */}
                {categorizedProducts.map((cat) => {
                    const catLabel = pickCategoryName(cat, userLang)
                    return (
                        <div
                            key={cat.id}
                            id={cat.slug}
                            ref={(el) => {
                                categoryRefs.current[cat.slug] = el
                            }} style={{ marginBottom: '2rem' }}
                        >
                            <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{catLabel}</h3>

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
                                            onClick={() =>
                                                console.log(`Clicked: ${displayName} in category ${cat.slug}`)
                                            }
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
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
