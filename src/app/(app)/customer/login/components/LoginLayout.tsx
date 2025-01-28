"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useShopBranding } from "@/context/ShopBrandingContext";

interface Props {
    shopSlug: string;
}

/**
 * A client component that works like your OrderLayout or AccountLayout:
 * - Calls `useShopBranding()` for the shop branding.
 * - Renders the login form (same logic as your original code).
 */
export default function LoginLayout({ shopSlug }: Props) {
    // 1) If the entire app is wrapped in <ShopBrandingProvider>,
    //    we can directly call:
    const branding = useShopBranding();
    console.log("[LoginLayout] branding =>", branding);

    const router = useRouter();

    // 2) Local form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    // 3) When user submits, POST to /api/customers/login
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

            // 4) Redirect to the "My Account" page
            router.push("/customer/account");
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        }
    }

    return (
        <div style={{ maxWidth: 400, margin: "40px auto" }}>
            {/* Example usage of branding: */}
            {branding.siteTitle && (
                <h2>{branding.siteTitle} - Login Page</h2>
            )}

            <h1>Customer Login (JWT in Header)</h1>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <form onSubmit={handleLogin}>
                <div>
                    <label>Email:</label>
                    <br />
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: "100%", marginBottom: 12 }}
                    />
                </div>

                <div>
                    <label>Password:</label>
                    <br />
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: "100%", marginBottom: 12 }}
                    />
                </div>

                <button type="submit">Login</button>
            </form>
        </div>
    );
}
