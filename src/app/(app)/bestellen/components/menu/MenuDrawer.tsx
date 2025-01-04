'use client'

import React, { useRef, MouseEvent } from 'react'
import { CSSTransition } from 'react-transition-group'

const LANGUAGES = [
    { label: 'NL', value: 'nl', flagSrc: '/images/flags/nl-BE.svg' },
    { label: 'EN', value: 'en', flagSrc: '/images/flags/en-UK.svg' },
    { label: 'FR', value: 'fr', flagSrc: '/images/flags/fr-FR.svg' },
    { label: 'DE', value: 'de', flagSrc: '/images/flags/de-DE.svg' },
]

type MenuDrawerProps = {
    isOpen: boolean
    onClose: () => void
    userLang: string
    onLangChange: (langValue: string) => void
}

/**
 * MenuDrawer with TWO separate transitions:
 *  - The overlay fade (behind the drawer),
 *  - The drawer slide in from the left (on top).
 */
export default function MenuDrawer({
    isOpen,
    onClose,
    userLang,
    onLangChange,
}: MenuDrawerProps) {
    // Refs for the two separate transitions
    const overlayRef = useRef<HTMLDivElement>(null)
    const drawerRef = useRef<HTMLDivElement>(null)

    /** If user clicks outside the white panel => close. */
    function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    function handleLangClick(langValue: string) {
        onLangChange(langValue)
    }

    return (
        <>
            {/* 
        1) The black overlay fade in/out, behind the drawer.
        If isOpen => fadeOverlay-enter, etc. 
      */}
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

            {/*
        2) The white drawer slides left-to-right, *on top* of the overlay.
        If isOpen => slideDrawer-enter, etc.
      */}
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
                        Menu
                    </div>

                    {/* Some links / language chooser */}
                    <nav className="m-4 grid p-4 text-gray-500 gap-6">
                        <div className="flex items-center gap-2 justify-center">
                            <div className="language-switcher flex gap-2">
                                {LANGUAGES.map((lang) => (
                                    <img
                                        key={lang.value}
                                        src={lang.flagSrc}
                                        alt={lang.label}
                                        onClick={() => handleLangClick(lang.value)}
                                        className={`
                      w-8 h-8 cursor-pointer
                      rounded
                      border
                      ${userLang === lang.value
                                                ? 'border-blue-500'
                                                : 'border-transparent hover:border-gray-300'
                                            }
                    `}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Login link */}
                        <a
                            href="/login"
                            className="
                flex items-center justify-center
                p-3 w-60 mx-auto
                text-md
                bg-green-600
                text-white
                rounded-full
                hover:bg-green-700
              "
                        >
                            Login
                        </a>

                        {/* Another link */}
                        <a href="/contact" className="text-center hover:text-blue-600">
                            Contact
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
    )
}
