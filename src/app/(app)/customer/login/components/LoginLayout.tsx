"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useShopBranding } from "@/context/ShopBrandingContext";

import LandingHeader from "@/app/(app)/components/LandingHeader";
import Footer from "@/app/(app)/components/Footer";

interface Props {
    shopSlug: string;
    shopData?: any;
}

export default function LoginLayout({ shopSlug, shopData }: Props) {
    // Grab branding from context
    const branding = useShopBranding();
    console.log("[LoginLayout] branding =>", branding);

    const router = useRouter();

    // Local states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    // We'll use the CTA color if present; fallback to something
    const ctaColor = branding.primaryColorCTA || "#3490dc";

    // Submit => POST /api/customers/login
    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        try {
            const res = await fetch("/api/customers/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || "Login failed");
            }

            const { user, token } = await res.json();
            if (!token || !user?.id) {
                throw new Error("Missing token or user ID in login response");
            }

            localStorage.setItem("customerToken", token);
            localStorage.setItem("customerID", user.id);
            router.push("/customer/account");
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <LandingHeader
                siteTitle={branding.siteTitle}
                logoUrl={branding.logoUrl}
                headerBg={branding.headerBackgroundColor}
                primaryColorCTA={branding.primaryColorCTA}
                branding={branding}
            />

            {/* Main */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto w-full">

                <h2 className="text-2xl font-bold mb-8">
                    Klantenlogin
                </h2>


                {error && <p className="text-red-600 mb-4">{error}</p>}

                <form onSubmit={handleLogin} className="w-full space-y-4">
                    <div>
                        <label className="block mb-1 font-medium">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="
                w-full 
                border border-gray-300 
                rounded-md 
                p-2 
                focus:outline-none 
                focus:border-blue-500
              "
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-medium">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="
                w-full 
                border border-gray-300 
                rounded-md 
                p-2 
                focus:outline-none 
                focus:border-blue-500
              "
                        />
                    </div>

                    {/* The Login button uses CTA color */}
                    <button
                        type="submit"
                        className="
              w-full
              text-white
              font-semibold
              rounded-md
              py-2
              mt-2
              hover:opacity-90
              transition-opacity
            "
                        style={{ backgroundColor: ctaColor }}
                    >
                        Login
                    </button>
                </form>
            </main>

            {/* Footer */}
            <Footer branding={branding} shopData={shopData} />
        </div>
    );
}
