// File: /src/app/(app)/index/hooks/useBranding.ts
"use client"

import { useEffect, useState } from "react"

interface BrandingData {
    siteTitle?: string
    siteHeaderImg?: string
}

interface UseBrandingOptions {
    shopSlug: string
}

export function useBranding({ shopSlug }: UseBrandingOptions) {
    const [branding, setBranding] = useState<BrandingData>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true

        async function fetchData() {
            try {
                setIsLoading(true)
                setError(null)

                const url = `/api/branding?host=${shopSlug}`
                const res = await fetch(url, { cache: "no-store" })
                if (!res.ok) {
                    throw new Error(`Branding fetch failed with status ${res.status}`)
                }

                const data = await res.json()
                if (!data?.branding) {
                    // If your route returns {branding: null}, handle that
                    throw new Error(`No branding found for shop slug: ${shopSlug}`)
                }

                if (isMounted) {
                    setBranding({
                        siteTitle: data.branding.siteTitle || "My Kiosk Site",
                        siteHeaderImg: data.branding.siteHeaderImg?.s3_url ?? "/images/defaultHeader.jpg",
                    })
                    setIsLoading(false)
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || "Unknown error")
                    setIsLoading(false)
                }
            }
        }

        fetchData()

        return () => {
            isMounted = false
        }
    }, [shopSlug])

    return { branding, isLoading, error }
}
