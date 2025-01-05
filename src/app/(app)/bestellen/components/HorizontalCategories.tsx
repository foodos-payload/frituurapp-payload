"use client";

import React, { useRef, useEffect, MouseEvent } from "react";

interface Category {
  id: string;
  slug: string;

  // The default "label" plus optional translations:
  label: string;
  name_nl: string;
  name_en?: string;
  name_de?: string;
  name_fr?: string;
  image?: { url: string; alt: string };
}

type Branding = {
  categoryCardBgColor?: string;
  // ...
};

type Props = {
  categories: Category[];
  activeCategory: string;
  onCategoryClick: (slug: string) => void;
  branding?: Branding;
  userLang?: string;
};

/**
 * A horizontally scrollable category bar with minimal styling changes.
 * This version handles translations but does not do anything special for kiosk mode.
 */
export default function HorizontalCategories({
  categories,
  activeCategory,
  onCategoryClick,
  branding,
  userLang,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // We'll use this color for "active" + "hover" states if provided
  const brandBgColor = branding?.categoryCardBgColor || "#3b82f6";

  function handleMouseEnter(e: MouseEvent<HTMLAnchorElement>, isActive: boolean) {
    if (!isActive) {
      e.currentTarget.style.backgroundColor = brandBgColor;
      e.currentTarget.style.color = "#ffffff";
    }
  }

  function handleMouseLeave(e: MouseEvent<HTMLAnchorElement>, isActive: boolean) {
    if (!isActive) {
      e.currentTarget.style.backgroundColor = "";
      e.currentTarget.style.color = "";
    }
  }

  // Auto-scroll the active link into view horizontally
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

  return (
    <div
      ref={containerRef}
      className="
        w-full flex overflow-x-auto gap-2 pb-1
        bg-white rounded shadow-sm font-medium
        scroll-smooth
      "
      style={{ scrollbarWidth: "thin" }}
    >
      {categories.map((cat) => {
        const isActive = cat.slug === activeCategory;

        return (
          <a
            key={cat.id}
            href={`#cat-${cat.slug}`}
            data-slug={cat.slug}
            onClick={(e) => {
              onCategoryClick(cat.slug);
              e.currentTarget.blur();
            }}
            onMouseEnter={(e) => handleMouseEnter(e, isActive)}
            onMouseLeave={(e) => handleMouseLeave(e, isActive)}
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
                ? "" /* Active => brand color + white text from style{} */
                : "bg-gray-100 text-gray-700"
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
