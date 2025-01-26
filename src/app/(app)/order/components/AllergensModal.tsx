// File: /src/app/(app)/order/components/AllergensModal.tsx
"use client";

import React, { useState, useEffect } from "react";

const allergenIcons: Record<string, string> = {
    gluten: "/images/allergens/gluten.png",
    eggs: "/images/allergens/eggs.png",
    fish: "/images/allergens/fish.png",
    peanuts: "/images/allergens/peanuts.png",
    soybeans: "/images/allergens/soybeans.png",
    milk: "/images/allergens/milk.png",
    nuts: "/images/allergens/nuts.png",
    celery: "/images/allergens/celery.png",
    mustard: "/images/allergens/mustard.png",
    sesame: "/images/allergens/sesame.png",
    lupin: "/images/allergens/lupin.png",
    molluscs: "/images/allergens/molluscs.png",
    crustaceans: "/images/allergens/crustaceans.png",
    sulphites: "/images/allergens/sulphites.png",
    propolis: "/images/allergens/propolis.png",
    corn: "/images/allergens/corn.png",
};

const ALL_ALLERGENS = Object.keys(allergenIcons);

interface AllergensModalProps {
    /** Called when the user closes the modal. */
    onClose: () => void;
    /** Optional brand color for highlighting. */
    brandCTA?: string;
    /**
     * A callback passed down from the parent component (e.g. OrderLayout).
     * Should update the parent's allergen state so the filter re-renders immediately.
     */
    onAllergensChange: (newAllergens: string[]) => void;
}

export default function AllergensModal({
    onClose,
    brandCTA = "#3b82f6",
    onAllergensChange,
}: AllergensModalProps) {
    const [selected, setSelected] = useState<string[]>([]);

    // 1) On mount, read from localStorage (optional)
    useEffect(() => {
        const stored = localStorage.getItem("userAllergens") || "";
        const arr = stored
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        setSelected(arr);
    }, []);

    function toggleAllergen(a: string) {
        setSelected((prev) =>
            prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
        );
    }

    // 2) On Apply => Save to localStorage, then call onAllergensChange
    function handleApply() {
        if (selected.length > 0) {
            localStorage.setItem("userAllergens", selected.join(","));
            // Trigger parent re-render
            onAllergensChange(selected);
        } else {
            localStorage.removeItem("userAllergens");
            onAllergensChange([]);
        }
        onClose();
    }

    // 3) On Clear => remove from localStorage, reset selected, call onAllergensChange([])
    function handleClear() {
        setSelected([]);
        localStorage.removeItem("userAllergens");
        // Trigger parent re-render with empty array
        onAllergensChange([]);
        onClose();
    }

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-xl p-6 max-w-sm w-full relative">
                <h2 className="text-xl font-bold mb-4 text-center">Select Allergens</h2>

                <div className="grid grid-cols-3 gap-4">
                    {ALL_ALLERGENS.map((allergen) => {
                        const isChecked = selected.includes(allergen);
                        const icon = allergenIcons[allergen] || "❓";
                        // Light alpha background using brandCTA
                        const alphaBg = brandCTA + "1A";

                        return (
                            <div
                                key={allergen}
                                className="flex flex-col items-center justify-center p-3
                           cursor-pointer border rounded-xl transition-colors"
                                style={
                                    isChecked
                                        ? { backgroundColor: alphaBg, borderColor: brandCTA }
                                        : {}
                                }
                                onClick={() => toggleAllergen(allergen)}
                            >
                                <img
                                    src={icon}
                                    alt={`${allergen} icon`}
                                    className="h-8 w-8 object-contain mix-blend-multiply"
                                    style={{ mixBlendMode: "multiply" }}
                                />
                                <span className="mt-1 text-sm text-gray-700">{allergen}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 flex justify-center gap-3">
                    <button
                        className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        onClick={handleClear}
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleApply}
                        style={{ backgroundColor: brandCTA }}
                        className="px-4 py-2 text-white rounded hover:opacity-90"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
