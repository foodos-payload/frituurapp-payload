'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  price: number
  image?: {
    url: string
    alt?: string
  }
  webdescription?: string
  categories?: {
    name: string
  }[]
}

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          console.log(product, 'product')
          return (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                {product.image?.url ? (
                <div className="relative h-48 w-full">
                  <Image
                    src={product.image.url}
                    alt={product.image.alt || product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="h-48 bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="line-clamp-1">{product.name}</CardTitle>
              {product.categories && product.categories.length > 0 && (
                <CardDescription className="text-sm text-muted-foreground">
                  {product.categories.map((cat) => cat.name).join(', ')}
                </CardDescription>
              )}
              {product.webdescription && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {product.webdescription}
                </p>
              )}
            </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
