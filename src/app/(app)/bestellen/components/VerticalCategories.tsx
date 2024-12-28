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
  useEffect(() => {
    console.log('[VerticalCategories] activeCategory changed:', activeCategory)
  }, [activeCategory])

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem' }}>
      <h3>Categories (Vertical)</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {categories.map((cat) => {
          const isActive = cat.slug === activeCategory
          return (
            <li key={cat.id} style={{ margin: '0.5rem 0' }}>
              <button
                style={{
                  backgroundColor: isActive ? '#ccc' : '#fff',
                  fontWeight: isActive ? 'bold' : 'normal',
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  console.log(`[VerticalCategories] clicked ${cat.slug}`)
                  onCategoryClick(cat.slug)
                }}
              >
                {cat.label}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
