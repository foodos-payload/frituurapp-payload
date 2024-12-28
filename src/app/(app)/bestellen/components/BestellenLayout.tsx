// File: /app/(app)/bestellen/components/BestellenLayout.tsx
'use client'  // if you want to do any client-side logic, otherwise remove

import React from 'react'
import ProductList from './ProductList'

// Example data shape
type Product = {
  id: string
  name_nl: string
  name_en?: string
  name_de?: string
  name_fr?: string
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
  name_de?: string
  name_fr?: string
  products: Product[]
}

interface Props {
  shopSlug: string
  categorizedProducts: Category[]
  userLang?: string
}

export default function BestellenLayout({
  shopSlug,
  categorizedProducts,
  userLang,
}: Props) {
  return (
    <div style={{ padding: 20 }}>
      <h1>Bestellen Layout</h1>
      <p>
        Shop Slug: <strong>{shopSlug}</strong>
      </p>
      <p>Detected Language: {userLang}</p>

      {/* Here we pass the categories to ProductList */}
      <ProductList
        categorizedProducts={categorizedProducts}
        userLang={userLang}
      />
    </div>
  )
}
