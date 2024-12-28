// File: /app/(app)/bestellen/components/ProductList.tsx
'use client'

import React from 'react'
import ProductCard from './ProductCard'

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
  // ...
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

export default function ProductList({ categorizedProducts, userLang }: Props) {
  return (
    <div>
      <h2>Product List</h2>
      {categorizedProducts.map((cat) => {
        // pick categoryName based on userLang
        const catName = pickCategoryName(cat, userLang)
        return (
          <div key={cat.id} style={{ margin: '1rem 0' }}>
            <h3 style={{ fontWeight: 'bold' }}>{catName}</h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {cat.products.map((prod) => {
                // transform product for display
                const displayName = pickProductName(prod, userLang)
                const displayDesc = pickDescription(prod, userLang)

                return (
                  <ProductCard
                    key={prod.id}
                    product={{
                      ...prod,
                      // override or add a single “displayName”/“displayDesc” field:
                      displayName,
                      displayDesc,
                    }}
                    onClick={() => {
                      alert(`Clicked: ${displayName}`)
                    }}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// A couple of helpers:
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
