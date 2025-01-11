// File: /src/app/(app)/digital-menu/helpers/buildPagesFromCategories.ts

interface Product {
    id: string
    name_nl: string
    price: number
    old_price?: number
}

interface Category {
    id: string
    slug: string
    name_nl: string
    products: Product[]
}

// Additional overrides
export interface CategoryOverride {
    displayName?: string
    columnsForProducts?: number
}

// Row object can be either a CategoryTitle row or a ProductRow
export type CategoryTitleRow = {
    type: "category-title"
    categoryName: string
    categorySlug: string
}
export type ProductRow = {
    type: "product-row"
    categorySlug: string
    products: Product[]
}
export type DigitalMenuRow = CategoryTitleRow | ProductRow

/**
 * Now we accept catOverrides as an optional object
 * Key = category ID
 * Value = { displayName?: string; columnsForProducts?: number }
 */
export function buildPagesFromCategories(
    categories: Category[],
    maxRows: number,
    catOverrides?: Record<string, CategoryOverride>
): DigitalMenuRow[][] {
    const pages: DigitalMenuRow[][] = []
    let currentScreenRows: DigitalMenuRow[] = []
    let usedRows = 0

    for (const cat of categories) {
        // 1) Override name if catOverrides found
        const override = catOverrides?.[cat.id] || {}
        const catDisplayName = override.displayName || cat.name_nl || cat.slug

        // Insert category-title row
        if (usedRows === maxRows) {
            pages.push(currentScreenRows)
            currentScreenRows = []
            usedRows = 0
        }
        currentScreenRows.push({
            type: "category-title",
            categoryName: catDisplayName,
            categorySlug: cat.slug,
        })
        usedRows++

        // 2) Determine how many columns for products
        //    If we have an override columnsForProducts, use it. Otherwise fallback
        //    to your old getNumColsForCategory logic
        const overrideCols = override.columnsForProducts
        const getCols = overrideCols
            ? () => overrideCols
            : getNumColsForCategory // your old function

        let index = 0
        while (index < cat.products.length) {
            const numCols = getCols(cat.slug)
            const rowProducts = cat.products.slice(index, index + numCols)
            index += numCols

            if (usedRows === maxRows) {
                pages.push(currentScreenRows)
                currentScreenRows = []
                usedRows = 0
            }

            currentScreenRows.push({
                type: "product-row",
                categorySlug: cat.slug,
                products: rowProducts,
            })
            usedRows++
        }
    }

    // end => push the final page if not empty
    if (currentScreenRows.length > 0) {
        pages.push(currentScreenRows)
    }

    return pages
}

// (unchanged) example fallback function:
function getNumColsForCategory(slug: string): number {
    const fourColSlugs = ["drinks", "wine"]
    const threeColSlugs = ["sauces"]

    if (fourColSlugs.includes(slug)) return 4
    if (threeColSlugs.includes(slug)) return 3
    return 2
}
