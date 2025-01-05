// File: /src/app/(app)/order/components/MenuDrawer.tsx
"use client";

import React, { useRef, MouseEvent } from "react";
import { CSSTransition } from "react-transition-group";
// 1) Import your LanguageSwitcher (adjust path as needed)
import { LanguageSwitcher } from "../../../../components/LanguageSwitcher/LanguageSwitcher";
import { useTranslation } from "@/context/TranslationsContext";

type Branding = {
    categoryCardBgColor?: string;
    primaryColorCTA?: string;
    // ... any others if needed
};

type MenuDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    userLang: string;
    onLangChange: (langValue: string) => void;
    branding?: Branding;
};

/**
 * MenuDrawer with two separate transitions:
 * - The overlay fade (behind the drawer),
 * - The drawer slide in from the left (on top).
 */
export default function MenuDrawer({
    isOpen,
    onClose,
    userLang,
    onLangChange,
    branding,
}: MenuDrawerProps) {
    const { t } = useTranslation();

    // Refs for the two separate transitions
    const overlayRef = useRef<HTMLDivElement>(null);
    const drawerRef = useRef<HTMLDivElement>(null);

    /** If user clicks outside the white panel => close. */
    function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    /** 
     * Called when a language is clicked from the LanguageSwitcher.
     * Just pass it up so the parent can do what it needs to do
     * (like storing in localStorage, or re-routing, etc.).
     */
    function handleLangChange(langValue: string) {
        onLangChange(langValue);
    }

    const brandCTA = branding?.primaryColorCTA || "#3b82f6";

    return (
        <>
            {/* 1) The overlay fade transition */}
            <CSSTransition
                in={isOpen}
                timeout={300}
                classNames="fadeOverlay"
                unmountOnExit
                nodeRef={overlayRef}
            >
                <div
                    ref={overlayRef}
                    onClick={handleOverlayClick}
                    className="fixed inset-0 z-[9997] bg-black/50"
                />
            </CSSTransition>

            {/* 2) The white drawer slide transition */}
            <CSSTransition
                in={isOpen}
                timeout={300}
                classNames="slideDrawer"
                unmountOnExit
                nodeRef={drawerRef}
            >
                <div
                    ref={drawerRef}
                    className="
                        fixed
                        top-0 bottom-0 left-0
                        z-[9998]
                        w-11/12 max-w-lg
                        bg-white
                        shadow-lg
                        flex flex-col
                    "
                >
                    {/* Close button */}
                    <div className="relative flex justify-end p-2">
                        <svg
                            onClick={onClose}
                            className="
                                cursor-pointer
                                absolute
                                top-6 right-8
                                bg-red-500
                                rounded-xl
                                shadow-xl
                                p-1.5
                                text-white
                            "
                            xmlns="http://www.w3.org/2000/svg"
                            width="44"
                            height="44"
                            viewBox="0 0 512 512"
                        >
                            <path
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="42"
                                d="M368 368L144 144M368 144L144 368"
                            />
                        </svg>
                    </div>

                    <div className="mt-8 text-center text-lg font-semibold">
                        {t("order.menu.title")}
                    </div>

                    {/* Language chooser + other links */}
                    <nav className="m-4 grid p-4 text-gray-500 gap-6">
                        {/* 2) Our LanguageSwitcher replaces the old map of flags */}
                        <div className="flex items-center justify-center">
                            <LanguageSwitcher
                                userLang={userLang}
                                onLangChange={handleLangChange}
                            />
                        </div>

                        {/* Example: a "Login" button */}
                        <a
                            href="/login"
                            style={{ borderRadius: "0.5rem", backgroundColor: brandCTA }}
                            className="
                                flex items-center justify-center
                                p-3 w-60 mx-auto
                                text-md
                                text-white
                                rounded-full
                            "
                        >
                            {t("order.menu.login")}
                        </a>

                        {/* Another link */}
                        <a href="/contact" className="text-center hover:text-blue-600">
                            {t("order.menu.contact")}
                        </a>
                    </nav>

                    {/* Footer / version */}
                    <div className="mt-auto text-center p-8 text-[10px] text-gray-400">
                        <a href="/" title="4.0.15">
                            Frituurapp v2.0
                        </a>
                    </div>
                </div>
            </CSSTransition>
        </>
    );
}
