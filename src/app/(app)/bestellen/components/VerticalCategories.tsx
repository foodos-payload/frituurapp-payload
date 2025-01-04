"use client";

import React, { useEffect, MouseEvent } from "react";

interface Category {
  id: string;
  slug: string;
  label: string;
}

type Branding = {
  /** e.g. "#ECAA02" or some other brand color */
  categoryCardBgColor?: string;
  // ...
};

type Props = {
  categories: Category[];
  activeCategory: string;
  onCategoryClick: (slug: string) => void;
  branding?: Branding;
};

export default function VerticalCategories({
  categories,
  activeCategory,
  onCategoryClick,
  branding,
}: Props) {
  // Optional: log whenever activeCategory changes
  useEffect(() => {
    console.log("[VerticalCategories] activeCategory changed:", activeCategory);
  }, [activeCategory]);

  // We'll use this brand color as fallback if none is provided
  const brandBgColor = branding?.categoryCardBgColor || "#3b82f6";
  // #3b82f6 is close to "blue-600" in Tailwind

  // For hover changes on non-active items:
  function handleMouseEnter(e: MouseEvent<HTMLAnchorElement>, isActive: boolean) {
    if (!isActive) {
      e.currentTarget.style.backgroundColor = brandBgColor;
      e.currentTarget.style.color = "#ffffff";
    }
  }

  function handleMouseLeave(e: MouseEvent<HTMLAnchorElement>, isActive: boolean) {
    if (!isActive) {
      // revert to the default
      e.currentTarget.style.backgroundColor = "transparent";
      e.currentTarget.style.color = "";
    }
  }

  return (
    <div
      className="
        sticky
        top-[120px]    
        flex
        flex-col
        min-w-[200px]
        h-[70vh]
        overflow-y-auto
        bg-[#fbfafc]
        rounded
        shadow
        font-medium
        scroll-smooth
      "
    >
      {categories.map((cat) => {
        const isActive = cat.slug === activeCategory;
        return (
          <a
            key={cat.id}
            href={`#cat-${cat.slug}`}  // anchor to your section in ProductList
            onClick={() => onCategoryClick(cat.slug)}
            onMouseEnter={(e) => handleMouseEnter(e, isActive)}
            onMouseLeave={(e) => handleMouseLeave(e, isActive)}
            // active => brand color, else transparent
            style={
              isActive
                ? {
                  backgroundColor: brandBgColor,
                  color: "#fff",
                }
                : { backgroundColor: "transparent" }
            }
            className="
              block
              text-left
              text-md
              px-3 py-2
              border-b border-gray-200
              cursor-pointer
              transition-colors
            "
          >
            {cat.label}
          </a>
        );
      })}
    </div>
  );
}
