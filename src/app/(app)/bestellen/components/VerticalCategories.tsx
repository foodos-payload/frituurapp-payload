// File: /app/(app)/bestellen/components/VerticalCategories.tsx
'use client'

import React, { useEffect } from 'react'

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

export default function VerticalCategories({
  categories,
  activeCategory,
  onCategoryClick,
}: Props) {
  // Optional: log whenever activeCategory changes
  useEffect(() => {
    console.log('[VerticalCategories] activeCategory changed:', activeCategory)
  }, [activeCategory])

  return (
    <div
      className="
        sticky
        top-[120px]           /* or top-[80px], depending on your layout */
        flex
        flex-col
        min-w-[200px]
        max-w-[230px]
        h-[70vh]
        overflow-y-auto
        bg-[#fbfafc]
        rounded
        shadow
        font-medium
        scroll-smooth          /* Enables smooth scrolling to anchor targets */
      "
    >
      {categories.map((cat) => {
        const isActive = cat.slug === activeCategory

        return (
          <a
            key={cat.id}
            href={`#cat-${cat.slug}`}       // Link to the <section id="cat-${slug}">
            onClick={() => onCategoryClick(cat.slug)}
            className={`
              block
              text-left
              px-3 py-2
              border-b border-gray-200
              cursor-pointer
              transition-colors
              ${isActive
                ? 'bg-blue-600 text-white'
                : 'hover:bg-blue-600 hover:text-white bg-transparent'
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
