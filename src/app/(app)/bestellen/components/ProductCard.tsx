// File: /app/(app)/bestellen/components/ProductCard.tsx
'use client'

import React from 'react'

/** We'll store a "displayName" and "displayDesc" if we want. */
type Product = {
  id: string
  displayName: string
  displayDesc?: string

  price: number | null
  image?: { url: string; alt?: string }
  isPromotion?: boolean
  // ...and any other raw fields you might want to conditionally show
}

interface Props {
  product: Product
  onClick?: (product: Product) => void
}

export default function ProductCard({ product, onClick }: Props) {
  const handleClick = () => {
    if (onClick) {
      onClick(product)
    }
  }

  return (
    <div
      onClick={handleClick}
      style={{
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '0.5rem',
        cursor: onClick ? 'pointer' : 'default',
        width: '200px', // example
      }}
    >
      {/* Name & Price */}
      <h4>{product.displayName}</h4>
      {product.price !== null && <p>Price: €{product.price.toFixed(2)}</p>}

      {/* If there's a description */}
      {product.displayDesc && <p>{product.displayDesc}</p>}

      {/* If it's a promotion */}
      {product.isPromotion && (
        <div style={{ color: 'red', fontWeight: 'bold' }}>Promotion!</div>
      )}

      {/* If there's an image */}
      {product.image?.url && (
        <img
          src={product.image.url}
          alt={product.image.alt || product.displayName}
          style={{ maxWidth: '100px', marginTop: '8px' }}
        />
      )}
    </div>
  )
}
