"use client";

import React, { useEffect, useRef, MouseEvent } from "react";

interface Category {
  id: string;
  slug: string;
  label: string;
}

type Branding = {
  /** e.g. "#ECAA02" or "#0f1820" */
  categoryCardBgColor?: string;
  // you can add more branding fields
};

type Props = {
  categories: Category[];
  activeCategory: string;
  onCategoryClick: (slug: string) => void;
  branding?: Branding;
};

/**
 * A horizontally scrollable category bar that anchor-links to #cat-slug.
 * We'll keep the anchor, and rely on ProductList for IntersectionObserver logic.
 * We override the default "blue" with `branding.categoryCardBgColor` if provided.
 */
export default function HorizontalCategories({
  categories,
  activeCategory,
  onCategoryClick,
  branding,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Center the active link horizontally whenever activeCategory changes
  useEffect(() => {
    if (!containerRef.current) return;
    const activeLink = containerRef.current.querySelector<HTMLAnchorElement>(
      `[data-slug="${activeCategory}"]`
    );
    if (activeLink) {
      activeLink.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeCategory]);

  // We'll use this color for "active" + "hover" states if present
  const brandBgColor = branding?.categoryCardBgColor || "#3b82f6";
  // ^ fallback to a Tailwind-like "blue-600" if none provided

  function handleMouseEnter(e: MouseEvent<HTMLAnchorElement>, isActive: boolean) {
    if (!isActive) {
      // For hover on a non-active item => brand color
      e.currentTarget.style.backgroundColor = brandBgColor;
      e.currentTarget.style.color = "#ffffff";
    }
  }

  function handleMouseLeave(e: MouseEvent<HTMLAnchorElement>, isActive: boolean) {
    if (!isActive) {
      // Restore defaults for non-active
      e.currentTarget.style.backgroundColor = "";
      e.currentTarget.style.color = "";
    }
  }

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
      style={{ scrollbarWidth: "thin" }}
    >
      {categories.map((cat) => {
        const isActive = cat.slug === activeCategory;

        return (
          <a
            key={cat.id}
            href={`#cat-${cat.slug}`} // anchor link
            data-slug={cat.slug}
            onClick={(e) => {
              // Let the parent do IntersectionObserver logic
              onCategoryClick(cat.slug);
              // remove focus style
              e.currentTarget.blur();
            }}
            onMouseEnter={(e) => handleMouseEnter(e, isActive)}
            onMouseLeave={(e) => handleMouseLeave(e, isActive)}
            // If this category is active => inline style the brand color
            style={
              isActive
                ? {
                  backgroundColor: brandBgColor,
                  color: "#fff",
                  borderRadius: "0.5rem",
                }
                : { borderRadius: "0.5rem" }
            }
            className={`
              whitespace-nowrap
              px-4 py-2
              border border-gray-300
              rounded-lg
              text-md
              cursor-pointer
              transition-colors
              ${isActive
                ? // active => brand color, white text
                ""
                : // non-active => default gray
                "bg-gray-100 text-gray-700"
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
