"use client";

import React, { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { FaPrint } from "react-icons/fa";

interface PrintPortalProps {
    onPrintKitchen(): void;
    onPrintCustomer(): void;
}

export function PrintPortal({ onPrintKitchen, onPrintCustomer }: PrintPortalProps) {
    // We'll store the popover's "open" state and position here
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });

    // The button ref => to measure bounding box
    const btnRef = useRef<HTMLButtonElement>(null);

    // When user clicks the trigger button => toggle
    function handleToggle(e: React.MouseEvent) {
        e.stopPropagation();
        // If we are opening => measure the button's bounding box
        if (!isOpen && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            // We'll position the popover just below & aligned to the right edge
            setCoords({
                x: rect.right - 110, // 110 is the popover width
                y: rect.bottom,
            });
        }
        setIsOpen((prev) => !prev);
    }

    // The popover menu node that will be portaled into <body>
    const popoverMenu = (
        <div
            style={{
                position: "absolute",
                top: coords.y,
                left: coords.x,
                width: "110px",
            }}
            className={`
        bg-white border border-gray-200 shadow-lg rounded-2xl p-2 z-[9999] 
        origin-top-right transition transform
        ${isOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}
      `}
            onClick={(e) => e.stopPropagation()} // so click inside doesn't close it
        >
            <button
                onClick={() => {
                    setIsOpen(false);
                    onPrintKitchen();
                }}
                className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded-lg"
            >
                Print K
            </button>
            <button
                onClick={() => {
                    setIsOpen(false);
                    onPrintCustomer();
                }}
                className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded-lg"
            >
                Print C
            </button>
        </div>
    );

    return (
        <div className="inline-block">
            {/* The trigger button: same styling as before, but with ref */}
            <button
                ref={btnRef}
                onClick={handleToggle}
                className="bg-white hover:bg-gray-100 border border-gray-300 rounded-full px-2 py-1 shadow inline-flex items-center text-gray-700"
            >
                <FaPrint size={14} />
            </button>

            {/* If open => portal the popover */}
            {isOpen && createPortal(popoverMenu, document.body)}
        </div>
    );
}
