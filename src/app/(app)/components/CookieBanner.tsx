"use client";

import React, { useState, useEffect } from "react";

/** Example Branding interface, adapt to match your real definition */
interface Branding {
    primaryColorCTA?: string;
    // ... add more fields if needed
}

interface CookieBannerProps {
    /**
     * Optional brand color or CTA color for the Accept button, e.g. "#068b59".
     * If provided, it overrides the branding?.primaryColorCTA.
     */
    acceptButtonColor?: string;

    /**
     * The brand object containing colors, logos, etc.
     * If present, we can default the accept button to branding.primaryColorCTA
     */
    branding?: Branding;
}

/**
 * A banner prompting the user to accept cookies.
 * If accepted, sets localStorage('cookieConsent') = 'true'.
 * Includes a "Learn more" link that opens a small modal
 * explaining data usage and default cookie policy.
 */
export default function CookieBanner({
    acceptButtonColor,
    branding,
}: CookieBannerProps) {
    const [visible, setVisible] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    // 1) Decide which color to use for the Accept button
    const buttonColor =
        acceptButtonColor || branding?.primaryColorCTA || "#068b59";

    useEffect(() => {
        // Check localStorage (or cookies) to see if user has accepted cookies
        const accepted = localStorage.getItem("cookieConsent");
        if (!accepted) {
            setVisible(true);
        }
    }, []);

    function handleAccept() {
        // Store user consent
        localStorage.setItem("cookieConsent", "true");
        setVisible(false);
    }

    function handleLearnMore(e: React.MouseEvent) {
        e.preventDefault(); // prevent navigation
        setModalOpen(true);
    }

    function handleCloseModal() {
        setModalOpen(false);
    }

    if (!visible) return null;

    return (
        <>
            {/* Cookie Banner */}
            <div
                className="
          fixed
          bottom-0
          left-0
          w-full
          bg-gray-900
          text-white
          px-4
          py-3
          z-50
        "
            >
                <div
                    className="
            max-w-[1200px]
            mx-auto
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
                >
                    <p className="text-sm">
                        We use cookies to improve your experience.&nbsp;
                        <a href="#" onClick={handleLearnMore} className="underline">
                            Learn more
                        </a>
                    </p>

                    <button
                        onClick={handleAccept}
                        className="
              px-4
              py-2
              rounded
              text-sm
              font-medium
              hover:opacity-90
              focus:outline-none
            "
                        style={{ backgroundColor: buttonColor }}
                    >
                        Accept
                    </button>
                </div>
            </div>

            {/* Modal (only if modalOpen is true) */}
            {modalOpen && (
                <div
                    className="
            fixed inset-0
            flex items-center justify-center
            bg-black bg-opacity-50
            z-50
          "
                >
                    <div
                        className="
              bg-white
              text-gray-800
              w-[90%]
              max-w-[500px]
              p-5
              rounded-lg
              shadow-lg
              relative
            "
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-2 right-3 text-gray-500 hover:text-gray-700"
                            aria-label="Close Modal"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-semibold mb-3">Our Data Policy</h3>
                        <p className="text-sm leading-relaxed mb-4">
                            We only use your personal information for <strong>order creation</strong>{" "}
                            and <strong>logging into our portal</strong>. No additional tracking
                            or analytics occur on this site. <br />
                            <br />
                            Our cookies are used solely for session management and to
                            remember your preferences (e.g. cookie acceptance). We do <em>not</em>{" "}
                            sell or share your data with third parties.
                        </p>

                        {/* Optionally, more default cookie policy text */}
                        <p className="text-sm text-gray-600">
                            This includes standard cookies required for the website to function properly
                            and no other user tracking technologies.
                        </p>

                        {/* You could add a confirm or “Okay” button if desired */}
                        <div className="mt-6 text-right">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 bg-gray-800 text-white rounded hover:opacity-90"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
