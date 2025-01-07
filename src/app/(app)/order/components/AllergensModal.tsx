// File: /src/app/(app)/order/components/AllergensModal.tsx
"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const allergenIcons: Record<string, string> = {
    gluten: "🌾",
    eggs: "🥚",
    fish: "🐟",
    peanuts: "🥜",
    soybeans: "🌱",
    milk: "🥛",
    nuts: "🌰",
    celery: "🥬",
    mustard: "🌭",
    sesame: "🤎",
    sulphites: "💨",
    lupin: "🫘",
    molluscs: "🦪",
}

const ALL_ALLERGENS = [
    "gluten",
    "eggs",
    "fish",
    "peanuts",
    "soybeans",
    "milk",
    "nuts",
    "celery",
    "mustard",
    "sesame",
    "sulphites",
    "lupin",
    "molluscs",
]

interface AllergensModalProps {
    onClose: () => void
    brandCTA?: string
}

export default function AllergensModal({
    onClose,
    brandCTA = "#3b82f6",
}: AllergensModalProps) {
    const [selected, setSelected] = useState<string[]>([])

    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const allergensParam = searchParams.get("allergens") || ""
        const parsed = allergensParam
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean)
        setSelected(parsed)
    }, [searchParams])

    function toggleAllergen(a: string) {
        setSelected(prev =>
            prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
        )
    }

    function handleApply() {
        const params = new URLSearchParams(searchParams.toString())
        if (selected.length > 0) {
            params.set("allergens", selected.join(","))
        } else {
            params.delete("allergens")
        }
        router.replace(`?${params.toString()}`)
        onClose()
    }

    function handleClear() {
        setSelected([])
        const params = new URLSearchParams(searchParams.toString())
        params.delete("allergens")
        router.replace(`?${params.toString()}`)
        onClose()
    }

    function handleCancel() {
        onClose()
    }

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div className="bg-white rounded-xl p-6 max-w-sm w-full relative">
                <h2 className="text-xl font-bold mb-4 text-center">Select Allergens</h2>

                <div className="grid grid-cols-3 gap-4">
                    {ALL_ALLERGENS.map((allergen) => {
                        const isChecked = selected.includes(allergen)
                        const icon = allergenIcons[allergen] || "❓"

                        // We'll do inline style: if isChecked => highlight with brandCTA
                        // Example: a tinted background + a border with brand color
                        // We'll do something like brandCTA + '33' for a light alpha BG
                        const alphaBg = brandCTA + "1A" // '1A' ~ 10% alpha in hex
                        const highlightStyle = {
                            backgroundColor: alphaBg,
                            borderColor: brandCTA,
                        }

                        return (
                            <div
                                key={allergen}
                                className={`
                  flex flex-col items-center justify-center
                  p-3 cursor-pointer border rounded-xl
                  transition-colors
                `}
                                style={isChecked ? highlightStyle : {}}
                                onClick={() => toggleAllergen(allergen)}
                            >
                                <span className="text-3xl">{icon}</span>
                                <span className="mt-1 text-sm text-gray-700">{allergen}</span>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-4 flex justify-center gap-3">
                    <button
                        className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        onClick={handleClear}
                    >
                        Clear
                    </button>
                    {/* <button className="px-4 py-2" onClick={handleCancel}>
                        Cancel
                    </button> */}
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
    )
}
