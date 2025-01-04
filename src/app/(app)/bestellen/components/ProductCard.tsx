// File: /app/(app)/bestellen/components/ProductCard.tsx
'use client'

import React from 'react'

/** Minimal shape for what we display in the card. */
type ProductCardProps = {
    id: string
    displayName: string
    displayDesc?: string
    price: number | null
    image?: { url: string; alt?: string }
    isPromotion?: boolean
    // isOutOfStock?: boolean
    // isFeatured?: boolean
    // any other fields from your data if needed
}

interface Props {
    product: ProductCardProps
    onClick?: (p: ProductCardProps) => void
    // If you want an out-of-stock or max-amount logic, you can pass them as props:
    // isOutOfStock?: boolean
    // isMaxAmountReached?: boolean
    // handleAddToCart?: (p: ProductCardProps) => void
}

export default function ProductCard({ product, onClick }: Props) {
    // If you want a separate "Add to cart" click vs entire card click, you can separate them:
    // function handleAddToCart(e: React.MouseEvent) {
    //   e.stopPropagation()
    //   if (handleAddToCart) handleAddToCart(product)
    // }

    const handleCardClick = () => {
        if (onClick) onClick(product)
    }

    return (
        <div
            onClick={handleCardClick}
            className={`
        relative 
        border border-gray-300 
        rounded-lg 
        overflow-hidden 
        shadow-lg 
        flex 
        bg-white
        cursor-pointer
        hover:shadow-xl
        transition-shadow
        // if you had an isPromotion class, you could do: ${product.isPromotion ? 'is-promotion' : ''}
      `}
            style={{ width: '100%', maxWidth: '420px', borderRadius: '4px' }} // Example max width
        >
            {/* 
        If you want an out-of-stock overlay or max-amount overlay, 
        you could do something like:
      */}
            {/* 
        {isOutOfStock && (
          <div className="
            absolute
            inset-0
            flex items-center justify-center
            bg-black bg-opacity-50
            text-white font-bold text-lg
            z-10
          ">
            Out of Stock
          </div>
        )} 
      */}

            {/* If there's a "Promotion" label: */}
            {product.isPromotion && (
                <div style={{ borderRadius: '4px' }} className="
          absolute
          top-3 left-3
          bg-red-500 
          text-white 
          text-xs 
          font-semibold 
          px-2 py-1 
          rounded
          z-20
        ">
                    Promotion
                </div>
            )}

            {/* 
        If you have a "featured" label or something else:
        {isFeatured && (
          <div className="
            absolute
            top-3 right-3
            bg-yellow-500 
            text-white 
            text-xs 
            font-bold 
            px-2 py-1 
            rounded
            z-20
          ">
            Featured
          </div>
        )} 
      */}

            {/* IMAGE side (40%) */}
            <div className="w-2/5 h-full flex items-center justify-center bg-gray-50">
                {product.image?.url ? (
                    <img
                        src={product.image.url}
                        alt={product.image.alt || product.displayName}
                        className="w-full h-full object-contain max-h-36"
                    />
                ) : (
                    <div className="text-gray-300 text-sm p-4">
                        {/* fallback / placeholder */}
                        No image
                    </div>
                )}
            </div>

            {/* CONTENT side (60%) */}
            <div className="w-3/5 p-3 flex flex-col justify-between relative">
                <div>
                    {/* Title */}
                    <h2 className="text-base font-bold mb-1 line-clamp-2">
                        {product.displayName}
                    </h2>

                    {/* Description */}
                    {product.displayDesc && (
                        <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                            {product.displayDesc}
                        </p>
                    )}
                </div>

                {/* Price row */}
                <div className="mt-2">
                    {typeof product.price === 'number' ? (
                        <span className="text-lg font-semibold text-gray-800">
                            €{product.price.toFixed(2)}
                        </span>
                    ) : (
                        <span className="text-sm text-gray-500">Price on request</span>
                    )}
                </div>


                <button
                    style={{ borderRadius: '4px' }}
                    className="
              absolute 
              bottom-2 right-2
              text-lg 
              bg-blue-600 
              text-white 
              px-2 py-0
              rounded 
              hover:bg-blue-700
            "
                >
                    +
                </button>

            </div>
        </div>
    )
}
