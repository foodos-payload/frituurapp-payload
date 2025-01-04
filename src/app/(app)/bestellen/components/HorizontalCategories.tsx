// File: /app/(app)/bestellen/components/HorizontalCategories.tsx
'use client'

import React, { useEffect, useRef } from 'react'

interface Category {
  id: string
  slug: string
  label: string
}

type Props = {
  categories: Category[]
  activeCategory: string
  onCategoryClick: (slug: string) => void
}

/**
 * A horizontally scrollable category bar that also anchor-links to #cat-{slug}.
 * When `activeCategory` changes (e.g., from a scroll observer in ProductList),
 * we auto-scroll so that the active category is visible within this container.
 */
export default function HorizontalCategories({
  categories,
  activeCategory,
  onCategoryClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Whenever the "activeCategory" changes, we scroll that link into view.
  useEffect(() => {
    if (!containerRef.current) return

    const activeLink = containerRef.current.querySelector<HTMLAnchorElement>(
      `[data-slug="${activeCategory}"]`
    )
    if (activeLink) {
      // Smoothly center the active link
      activeLink.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [activeCategory])

  return (
    <div
      ref={containerRef}
      className="w-full flex overflow-x-auto gap-2 pb-1 bg-white rounded shadow-sm font-medium scroll-smooth"
      style={{ scrollbarWidth: 'thin' }} // optional narrower scrollbar for Firefox
    >
      {categories.map((cat) => {
        const isActive = cat.slug === activeCategory
        return (
          <a
            key={cat.id}
            href={`#cat-${cat.slug}`}
            data-slug={cat.slug} // for the auto-scroll lookup
            onClick={() => onCategoryClick(cat.slug)}
            style={{ borderRadius: '4px' }}
            className={`
              whitespace-nowrap
              px-4 py-2
              border border-gray-300
              rounded-lg
              text-sm
              cursor-pointer
              transition-colors
              ${isActive
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white'
              }
            `}
          >
            {cat.label}
          </a>
        )
      })}
    </div>
  )
}
