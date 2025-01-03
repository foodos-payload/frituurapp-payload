// File: /app/(app)/bestellen/components/HorizontalCategories.tsx
'use client'

import React from 'react'

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

export default function HorizontalCategories({
  categories,
  activeCategory,
  onCategoryClick,
}: Props) {
  return (
    <div
      className="
        w-full
        flex
        overflow-x-auto
        gap-2
        pb-1
        bg-white
        rounded
        shadow-sm
        font-medium
        scroll-smooth
      "
      style={{ scrollbarWidth: 'thin' }} // optional narrower scrollbar for Firefox
    >
      {categories.map((cat) => {
        const isActive = cat.slug === activeCategory
        return (
          <a
            key={cat.id}
            href={`#cat-${cat.slug}`}
            onClick={() => onCategoryClick(cat.slug)}
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
