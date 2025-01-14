"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaPrint } from "react-icons/fa";

interface PrintPortalProps {
    onPrintKitchen(): void;
    onPrintCustomer(): void;
}

/**
 * PrintPortal:
 * - Contains a trigger button in the parent (card).
 * - Portals a popover into <body> with absolute positioning near the button.
 * - Closes if user clicks outside or scrolls/resizes (we re-measure).
 */
export function PrintPortal({ onPrintKitchen, onPrintCustomer }: PrintPortalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });

    // Refs for button + popover
    const btnRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Toggle popover open/closed
    function handleToggle(e: React.MouseEvent) {
        e.stopPropagation();
        setIsOpen((prev) => {
            if (!prev) measurePosition(); // measure if we're about to open
            return !prev;
        });
    }

    // Measure the button => store popover coords
    function measurePosition() {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        const popoverWidth = 110;

        // Convert from viewport coords to document coords
        const x = window.scrollX + rect.right - popoverWidth;
        const y = window.scrollY + rect.bottom;

        setCoords({ x, y });
    }

    // Re-measure on scroll/resize if open
    useEffect(() => {
        if (!isOpen) return;

        function handleReposition() {
            measurePosition();
        }

        window.addEventListener("scroll", handleReposition, true);
        window.addEventListener("resize", handleReposition, true);

        return () => {
            window.removeEventListener("scroll", handleReposition, true);
            window.removeEventListener("resize", handleReposition, true);
        };
    }, [isOpen]);

    // Close if user clicks outside popover + button
    useEffect(() => {
        if (!isOpen) return;

        function handleDocClick(e: Event) {
            if (
                !popoverRef.current?.contains(e.target as Node) &&
                !btnRef.current?.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleDocClick, true);
        document.addEventListener("touchstart", handleDocClick, true);

        return () => {
            document.removeEventListener("mousedown", handleDocClick, true);
            document.removeEventListener("touchstart", handleDocClick, true);
        };
    }, [isOpen]);

    // Popover menu to be portaled
    const popoverMenu = (
        <div
            ref={popoverRef}
            style={{
                position: "absolute",
                top: coords.y,
                left: coords.x,
                width: "110px",
            }}
            className={`
        bg-white border border-gray-200 shadow-lg rounded-2xl p-2 z-[9999]
        origin-top-right transition-transform
        ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}
      `}
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
            {/* Trigger button */}
            <button
                ref={btnRef}
                onClick={handleToggle}
                className="bg-white hover:bg-gray-100 border border-gray-300 rounded-full px-2 py-1 shadow inline-flex items-center text-gray-700"
            >
                <FaPrint size={14} />
            </button>

            {/* Portal the popover if open */}
            {isOpen && createPortal(popoverMenu, document.body)}
        </div>
    );
}
