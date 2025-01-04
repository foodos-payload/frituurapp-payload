'use client';

import React, { useEffect, useRef } from 'react';

interface Category {
  id: string;
  slug: string;
  label: string;
}

type Props = {
  categories: Category[];
  activeCategory: string;
  onCategoryClick: (slug: string) => void;
};

/**
 * A horizontally scrollable category bar that also anchor-links to #cat-{slug}.
 * We'll keep the anchor, and rely on ProductList to handle IntersectionObserver logic.
 */
export default function HorizontalCategories({
  categories,
  activeCategory,
  onCategoryClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Whenever activeCategory changes from IntersectionObserver, center horizontally
  useEffect(() => {
    if (!containerRef.current) return;

    const activeLink = containerRef.current.querySelector<HTMLAnchorElement>(
      `[data-slug="${activeCategory}"]`
    );
    if (activeLink) {
      activeLink.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeCategory]);

  return (
    <div
      ref={containerRef}
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
      style={{ scrollbarWidth: 'thin' }}
    >
      {categories.map((cat) => {
        const isActive = cat.slug === activeCategory;
        return (
          <a
            key={cat.id}
            href={`#cat-${cat.slug}`} // keep anchor
            data-slug={cat.slug}
            onClick={(e) => {
              // Force the link to lose focus, so it doesn't keep a "clicked" style
              e.currentTarget.blur();
              // Let parent do IntersectionObserver disconnect & highlight
              onCategoryClick(cat.slug);
            }}
            style={{ borderRadius: '0.5rem' }}
            className={`
              whitespace-nowrap
              px-4 py-2
              border border-gray-300
              rounded-lg
              text-md
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
        );
      })}
    </div>
  );
}
