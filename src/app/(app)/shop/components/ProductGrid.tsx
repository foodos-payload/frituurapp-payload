'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Image from 'next/image';

interface Category {
  id: string;
  slug: string;
  name: string;
  products: Product[];
}

interface Product {
  id: string;
  name_nl: string;
  price: number;
  isPromotion?: boolean;
  image?: {
    url: string;
    alt?: string;
  };
  webdescription?: string;
}

interface ProductGridProps {
  categorizedProducts: Category[];
}

export function ProductGrid({ categorizedProducts }: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for category sections
  const categoryRefs = useRef<Map<string, HTMLElement>>(new Map());

  const handleCategoryClick = (slug: string) => {
    const target = categoryRefs.current.get(slug);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveCategory(slug);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.5, // Adjust this for when the category header should activate
      },
    );

    categoryRefs.current.forEach((element) => observer.observe(element));

    return () => {
      categoryRefs.current.forEach((element) => observer.unobserve(element));
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 flex gap-4">
      {/* Vertical Categories for large screens */}
      <div className="hidden lg:block w-1/4 sticky top-0 h-screen overflow-y-auto bg-gray-100 p-4">
        <ul className="space-y-2">
          {categorizedProducts.map((category) => (
            <li key={category.slug}>
              <button
                onClick={() => handleCategoryClick(category.slug)}
                className={`text-md px-4 py-2 w-full text-left rounded-lg ${activeCategory === category.slug
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
                  } hover:bg-blue-400 hover:text-white transition`}
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Product Listings */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        {categorizedProducts.map((category) => (
          <div
            key={category.id}
            id={category.slug}
            ref={(el) => {
              if (el) {
                categoryRefs.current.set(category.slug, el);
              }
            }}
            className="mt-8"
          >
            <h2 className="text-xl font-bold mb-4">{category.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {category.products.map((product) => (
                <Card
                  key={product.id}
                  className="relative border rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow"
                >
                  {/* Product Image */}
                  <CardHeader className="p-0">
                    {product.image?.url ? (
                      <div className="relative h-48 w-full">
                        <Image
                          src={product.image.url}
                          alt={product.image.alt || product.name_nl}
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

                  {/* Product Details */}
                  <CardContent className="p-4">
                    <CardTitle className="line-clamp-1">{product.name_nl}</CardTitle>
                    {product.webdescription && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {product.webdescription}
                      </p>
                    )}
                    {product.isPromotion && (
                      <div className="text-sm text-red-500 font-semibold">
                        Promotion
                      </div>
                    )}
                    <div className="mt-2 text-lg font-bold">
                      €{product.price.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
