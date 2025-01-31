// File: /src/app/(app)/order/components/MenuDrawer.tsx
"use client";

import React, { useRef, MouseEvent } from "react";
import Link from "next/link";
import { CSSTransition } from "react-transition-group";
// We'll still import LanguageSwitcher, but no custom props:
import { LanguageSwitcher } from "../../../../components/LanguageSwitcher/LanguageSwitcher";
import { useTranslation } from "@/context/TranslationsContext";

type Branding = {
    categoryCardBgColor?: string;
    primaryColorCTA?: string;
};

type MenuDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    branding?: Branding;
};

export default function MenuDrawer({
    isOpen,
    onClose,
    branding,
}: MenuDrawerProps) {
    const { t } = useTranslation();

    // For transitions
    const overlayRef = useRef<HTMLDivElement>(null);
    const drawerRef = useRef<HTMLDivElement>(null);

    // If user clicks on overlay outside the white panel => close
    function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    const brandCTA = branding?.primaryColorCTA || "#068b59";

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
            w-full max-w-lg md:w-11/12
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

                    <nav className="m-4 grid p-4 text-gray-500 gap-6">
                        {/* 1) We now just use <LanguageSwitcher /> with no extra props */}
                        <div className="flex items-center justify-center">
                            <LanguageSwitcher />
                        </div>

                        {/* Example: a "Login" button */}
                        <Link
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
                        </Link>

                        <Link href="/contact" className="text-center hover:text-blue-600">
                            {t("order.menu.contact")}
                        </Link>

                    </nav>

                    {/* Footer / version */}
                    <div className="mt-auto text-center p-8 text-[10px] text-gray-400">
                        <span title="4.0.15">
                            Orderapp v2.0
                        </span>
                    </div>
                </div>
            </CSSTransition>
        </>
    );
}
