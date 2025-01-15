// File: /app/components/ContactForm.tsx
"use client";

import React from "react";
import { ShopBranding } from "@/context/ShopBrandingContext";

interface ContactFormProps {
    branding?: ShopBranding;
}

export default function ContactForm({ branding }: ContactFormProps) {
    // Full iframe HTML from branding (if any)
    const mapIframeHTML = branding?.googleMapsIframe || "";

    // Convert branding.borderRadius (number) => e.g. "0.5rem"
    const brandRadiusNumber = branding?.borderRadius ?? 0.5;
    const brandRadius = `${brandRadiusNumber}rem`;

    // The CTA color fallback
    const ctaColor = branding?.primaryColorCTA || "#068b59";

    return (
        <section id="contact" className="py-20 bg-white overflow-hidden
        z-10
        shadow-sm
        rounded-b-xl">
            <div className="max-w-[1200px] mx-auto px-4">
                <h2 className="text-2xl font-bold mb-10">Contact</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* LEFT: form */}
                    <form className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block font-medium mb-1">Name</label>
                            <input
                                type="text"
                                placeholder="Your name..."
                                className="w-full border border-gray-300 p-2"
                                style={{ borderRadius: brandRadius }}
                            />
                        </div>

                        {/* Email (optional) */}
                        <div>
                            <label className="block font-medium mb-1">Email (optional)</label>
                            <input
                                type="email"
                                placeholder="Your email..."
                                className="w-full border border-gray-300 p-2"
                                style={{ borderRadius: brandRadius }}
                            />
                        </div>

                        {/* Phone (optional) */}
                        <div>
                            <label className="block font-medium mb-1">Phone (optional)</label>
                            <input
                                type="tel"
                                placeholder="+32 4 123456..."
                                className="w-full border border-gray-300 p-2"
                                style={{ borderRadius: brandRadius }}
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block font-medium mb-1">Message</label>
                            <textarea
                                rows={5}
                                placeholder="How can we help?"
                                className="w-full border border-gray-300 p-2"
                                style={{ borderRadius: brandRadius }}
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="px-6 py-2 font-semibold text-white"
                            style={{
                                backgroundColor: ctaColor,
                                borderRadius: brandRadius,
                            }}
                        >
                            Send
                        </button>
                    </form>

                    {/* RIGHT: Google Maps iframe (responsive) */}
                    <div
                        className="relative w-full"
                        style={{
                            // This ensures a ~16:9 aspect ratio
                            paddingBottom: "56.25%",
                            borderRadius: brandRadius,
                            overflow: "hidden",
                        }}
                    >
                        {mapIframeHTML ? (
                            <div
                                // We absolutely position the iframe block:
                                className="absolute top-0 left-0 w-full h-[400px] sm:h-[400px] md:h-[500px]"
                                style={{ borderRadius: brandRadius, overflow: "hidden" }}
                                dangerouslySetInnerHTML={{ __html: mapIframeHTML }}
                            />
                        ) : (
                            <p className="text-gray-500">No map iframe provided...</p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
