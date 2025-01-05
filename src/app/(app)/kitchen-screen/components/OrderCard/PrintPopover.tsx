// File: /components/kitchen/OrderCard/PrintPopover.tsx
"use client"

import React from "react"
import { FaPrint } from "react-icons/fa"

interface PrintPopoverProps {
    isOpen: boolean
    onToggle(e: React.MouseEvent): void
    onPrintKitchen(): void
    onPrintCustomer(): void
}

export function PrintPopover({
    isOpen,
    onToggle,
    onPrintKitchen,
    onPrintCustomer,
}: PrintPopoverProps) {
    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className="bg-white hover:bg-gray-100 border border-gray-300 rounded-full px-2 py-1 shadow inline-flex items-center text-gray-700"
            >
                <FaPrint size={14} />
            </button>

            <div
                className={
                    "absolute top-full right-0 mt-2 w-[110px] bg-white border border-gray-200 shadow-lg rounded-2xl p-2 z-50 " +
                    "origin-top-right transition transform " +
                    (isOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none")
                }
            >
                <button
                    onClick={onPrintKitchen}
                    className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded-lg"
                >
                    Print K
                </button>
                <button
                    onClick={onPrintCustomer}
                    className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded-lg"
                >
                    Print C
                </button>
            </div>
        </div>
    )
}
