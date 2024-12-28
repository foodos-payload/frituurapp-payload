'use client'

import React, { useRef, useEffect } from 'react'

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
  const containerRef = useRef<HTMLDivElement>(null)

  // Log the activeCategory for debugging
  useEffect(() => {
    console.log('[HorizontalCategories] activeCategory changed:', activeCategory)
  }, [activeCategory])

  // Optionally auto-scroll the active category button into view
  // useEffect(() => {
  //   if (!activeCategory) return
  //   const activeBtn = containerRef.current?.querySelector<HTMLButtonElement>(
  //     `button[data-slug="${activeCategory}"]`
  //   )
  //   if (activeBtn) {
  //     activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center' })
  //   }
  // }, [activeCategory])

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        overflowX: 'auto',
        gap: '0.5rem',
        border: '1px solid #ccc',
        padding: '0.5rem',
        whiteSpace: 'nowrap',
      }}
    >
      {categories.map((cat) => {
        const isActive = cat.slug === activeCategory
        return (
          <button
            key={cat.id}
            data-slug={cat.slug}
            onClick={() => onCategoryClick(cat.slug)}
            style={{
              backgroundColor: isActive ? '#ccc' : '#fff',
              fontWeight: isActive ? 'bold' : 'normal',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
