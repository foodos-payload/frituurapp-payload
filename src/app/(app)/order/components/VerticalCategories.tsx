"use client";

import React, { useEffect, MouseEvent } from "react";

interface Category {
  id: string;
  slug: string;
  label: string;
  name_nl: string;
  name_en?: string;
  name_de?: string;
  name_fr?: string;
  image?: { url: string; alt: string };
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
  userLocale?: string;
  isKiosk?: boolean;
};

export default function VerticalCategories({
  categories,
  activeCategory,
  onCategoryClick,
  branding,
  isKiosk,
}: Props) {
  // Optional: log whenever activeCategory changes
  useEffect(() => {
    console.log("[VerticalCategories] activeCategory changed:", activeCategory);
  }, [activeCategory]);

  // We'll use this brand color as fallback if none is provided
  const brandBgColor = branding?.categoryCardBgColor || "#3b82f6";

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
      className={`
        sticky top-[120px]
        flex flex-col
        min-w-[200px]
        h-[70vh]
        overflow-y-auto
        bg-[#fbfafc]
        rounded
        shadow
        font-medium
        scroll-smooth
        ${isKiosk ? "p-2 gap-2" : ""}
      `}
    >
      {categories.map((cat) => {
        const isActive = cat.slug === activeCategory;
        return (
          <a
            key={cat.id}
            href={`#cat-${cat.slug}`} // anchor to your section in ProductList
            onClick={() => onCategoryClick(cat.slug)}
            onMouseEnter={(e) => handleMouseEnter(e, isActive)}
            onMouseLeave={(e) => handleMouseLeave(e, isActive)}
            style={
              isActive
                ? { backgroundColor: brandBgColor, color: "#fff" }
                : { backgroundColor: "transparent" }
            }
            className={`
              block
              text-left
              text-md
              border-b border-gray-200
              cursor-pointer
              transition-colors
              ${isKiosk ? "px-4 py-4 rounded-[0.5em] text-xl" : "px-3 py-2"}
            `}
          >
            {isKiosk && (
              <div className="mb-2 flex justify-center">
                {cat.image?.url ? (
                  <img
                    src={cat.image.url}
                    alt={cat.image.alt || cat.label}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  // Render a placeholder if no image, 
                  // so each kiosk tile has the same height
                  <div className="w-16 h-16 bg-gray-200 rounded" />
                )}
              </div>
            )}

            <div className={isKiosk ? "text-center font-bold" : "font-bold"}>
              {cat.label}
            </div>
          </a>
        );
      })}
    </div>
  );
}
