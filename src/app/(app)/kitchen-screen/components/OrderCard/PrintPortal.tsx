"use client";

import React, {
    useState,
    useRef,
    useLayoutEffect,
    useEffect,
    MouseEvent,
    RefObject,
} from "react";
import { createPortal } from "react-dom";
import { FaPrint } from "react-icons/fa";

interface PrintPortalProps {
    onPrintKitchen(): void;
    onPrintCustomer(): void;
}

/**
 * This component:
 *  - Places a trigger button in-line (using buttonRef).
 *  - Portals the popover into <body> with absolute positioning
 *    near the button's boundingClientRect.
 *  - Re-positions on window scroll/resize for a better chance
 *    of staying aligned on tablets, etc.
 *  - Closes when user clicks outside the popover or the button.
 */
export function PrintPortal({ onPrintKitchen, onPrintCustomer }: PrintPortalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const btnRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    // 1) Toggles the popover open/closed
    function handleToggle(e: React.MouseEvent) {
        e.stopPropagation();
        setIsOpen((prev) => {
            // If we’re about to open, measure position
            if (!prev) measurePosition();
            return !prev;
        });
    }

    // 2) Measure the button => set popover coords
    function measurePosition() {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();

        // Example logic: popover is 110px wide => align right edges
        const popoverWidth = 110;
        const x = rect.right - popoverWidth;
        const y = rect.bottom;

        setCoords({ x, y });
    }

    // 3) Re-measure on scroll/resize if open
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

    // 4) Close if user clicks outside
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

    // 5) The popover menu
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
            {/* The trigger button in the card */}
            <button
                ref={btnRef}
                onClick={handleToggle}
                className="bg-white hover:bg-gray-100 border border-gray-300 rounded-full px-2 py-1 shadow inline-flex items-center text-gray-700"
            >
                <FaPrint size={14} />
            </button>

            {/* Render the popover in <body> if open */}
            {isOpen && createPortal(popoverMenu, document.body)}
        </div>
    );
}
