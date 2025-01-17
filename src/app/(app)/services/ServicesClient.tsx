"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SubscribeButton } from "@/components/ui/subscribe-button"
import { ManageBillingButton } from "@/components/ui/ManageBillingButton"
import type { Service, Role, Media, User, Shop } from "@/payload-types"

type ServicesClientProps = {
    services: Service[]
    currentUser?: User
}

export default function ServicesClient({ services, currentUser }: ServicesClientProps) {
    const [isYearly, setIsYearly] = useState(false)
    const [selectedShops, setSelectedShops] = useState<Record<string, string>>({})
    const [selectedTenant, setSelectedTenant] = useState<string>("")

    const handleToggle = () => setIsYearly((prev) => !prev)

    // 1) Get user's shops
    const userShops = Array.isArray(currentUser?.shops) ? (currentUser.shops as Shop[]) : []

    // 2) Get user's tenant entries (where each entry is { tenant: <Tenant or ID>, roles: [...] })
    const userTenantEntries = Array.isArray(currentUser?.tenants)
        ? (currentUser.tenants)
        : []

    // 3) Only those where the user is "tenant-admin"
    const tenantAdminEntries = userTenantEntries.filter((entry) => {
        return entry.roles?.includes("tenant-admin")
    })

    // If the user has exactly one tenant-admin, auto-select it
    useEffect(() => {
        if (tenantAdminEntries.length === 1 && !selectedTenant) {
            const singleTenantObj = tenantAdminEntries[0].tenant
            const singleTenantID = typeof singleTenantObj === "object" ? singleTenantObj.id : singleTenantObj
            setSelectedTenant(singleTenantID)
        }
    }, [tenantAdminEntries, selectedTenant])

    // 4) Filter shops to only those that belong to selectedTenant (if any)
    const filteredShops = selectedTenant
        ? userShops.filter((shop) => {
            const tenantID = typeof shop.tenant === "object" ? shop.tenant.id : shop.tenant
            return tenantID === selectedTenant
        })
        : []

    return (
        <div className="min-h-screen bg-[#f2f2f2cb] flex flex-col items-center p-8">
            {/* Title */}
            <div className="w-full max-w-7xl mb-8 text-center">
                <h1 className="text-5xl md:text-6xl font-extrabold text-[#1f2a37] mb-4">
                    Choose Your Modules
                </h1>
                <p className="text-lg text-[#1f2a37] max-w-2xl mx-auto">
                    Simple pricing for restaurants, snackbars, shops, cafés—and more.
                </p>
            </div>

            {/* Billing Toggle + Manage Billing Row */}
            <div className="w-full max-w-7xl flex items-center justify-between">
                {/* Toggle (Monthly / Yearly) */}
                <div className="flex items-center space-x-2">
                    <span
                        className={`text-lg font-bold ${!isYearly ? "text-[#1f2a37]" : "text-gray-400"}`}
                    >
                        Monthly
                    </span>
                    <button
                        onClick={handleToggle}
                        className="relative inline-flex h-6 w-11 border-2 border-transparent
              rounded-full cursor-pointer transition-colors ease-in-out
              focus:outline-none bg-[#39454f]"
                    >
                        <span
                            className={`inline-block h-5 w-5 rounded-full bg-white transform transition
                ${isYearly ? "translate-x-5" : "translate-x-0"}`}
                        />
                    </button>
                    <span
                        className={`text-lg font-bold ${isYearly ? "text-[#1f2a37]" : "text-gray-400"}`}
                    >
                        Yearly
                    </span>
                </div>

                {/* Tenant-based Manage Billing */}
                {/* Only show a billing button if user is an admin for at least one tenant AND a tenant is selected */}
                {tenantAdminEntries.length > 0 && selectedTenant && (
                    <ManageBillingButton tenantId={selectedTenant} />
                )}
            </div>

            {/* Tenant Picker: only show if multiple tenant-admin entries exist */}
            {tenantAdminEntries.length > 1 && (
                <div className="w-full max-w-7xl mt-6 mb-2">
                    <label htmlFor="tenant-select" className="block text-sm font-medium mb-2">
                        Select Tenant
                    </label>
                    <select
                        id="tenant-select"
                        className="border p-2 rounded"
                        onChange={(e) => setSelectedTenant(e.target.value)}
                        value={selectedTenant}
                    >
                        <option value="">-- Select a Tenant --</option>
                        {tenantAdminEntries.map((entry) => {
                            const tObj = entry.tenant
                            const tID = typeof tObj === "object" ? tObj.id : tObj
                            const tName = typeof tObj === "object" ? tObj.name : "Unknown Tenant"
                            return (
                                <option key={tID} value={tID}>
                                    {tName}
                                </option>
                            )
                        })}
                    </select>
                </div>
            )}

            {/* Services Grid */}
            <div className="w-full max-w-7xl mt-10 grid md:grid-cols-3 gap-6">
                {services.map((service) => {
                    const thumbnail = service.service_thumbnail as Media

                    // Active subscriptions
                    const subscribedShops = (service.subscriptions || []).filter((sub) => sub.active)
                    const subscribedShopIDs = subscribedShops.map((sub) =>
                        typeof sub.shop === "object" ? sub.shop?.id : sub.shop
                    )

                    // Filter out shops that already have this service from the filteredShops
                    const unsubscribedShops = filteredShops.filter(
                        (sh) => !subscribedShopIDs.includes(sh.id),
                    )

                    // Price display
                    const displayedPrice = isYearly ? service.yearly_price : service.monthly_price

                    // Track the shop selection for this service
                    const selectedShop = selectedShops[service.id!] || ""
                    const handleShopChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                        setSelectedShops((prev) => ({
                            ...prev,
                            [service.id!]: e.target.value,
                        }))
                    }

                    // We can only subscribe if a tenant is selected AND there are unsubscribed shops
                    const canSubscribe = Boolean(selectedTenant) && unsubscribedShops.length > 0
                    const hasSelectedShop = Boolean(selectedShop)

                    return (
                        <Card
                            key={service.id}
                            className="flex flex-col rounded-xl border-4 border-[#39454f] bg-[#f2f2f2] shadow-2xl"
                        >
                            <CardHeader className="p-6">
                                {thumbnail?.url && (
                                    <Image
                                        src={thumbnail.url}
                                        alt={service.title_nl || "Service thumbnail"}
                                        width={600}
                                        height={600}
                                        className="mb-4 w-full h-48 object-cover rounded-md mix-blend-multiply"
                                    />
                                )}
                                <CardTitle className="text-2xl font-extrabold text-[#1f2a37]">
                                    {service.title_nl}
                                </CardTitle>
                                <CardDescription className="text-[#1f2a37] mt-1">
                                    {service.description_nl || "A powerful service for your business."}
                                </CardDescription>
                                <div className="mt-4 text-4xl font-bold text-[#1f2a37]">
                                    €{displayedPrice}
                                    <span className="ml-1 text-lg font-semibold">
                                        /{isYearly ? "year" : "month"}
                                    </span>
                                </div>
                            </CardHeader>

                            <CardFooter className="p-6 pt-0">
                                <div className="flex flex-row flex-wrap items-end gap-4">
                                    {canSubscribe ? (
                                        <>
                                            <div className="flex flex-col">
                                                <label
                                                    htmlFor={`shop-select-${service.id}`}
                                                    className="font-medium text-base text-[#1f2a37]"
                                                >
                                                    Choose Shop to Subscribe
                                                </label>
                                                <select
                                                    id={`shop-select-${service.id}`}
                                                    className="border border-[#39454f] p-2 rounded"
                                                    onChange={handleShopChange}
                                                    value={selectedShop}
                                                >
                                                    <option value="">-- Select a Shop --</option>
                                                    {unsubscribedShops.map((shop) => (
                                                        <option key={shop.id} value={shop.id}>
                                                            {shop.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <SubscribeButton
                                                priceId={
                                                    isYearly
                                                        ? service.stripe_yearly_price_id || undefined
                                                        : service.stripe_monthly_price_id || undefined
                                                }
                                                id={service.id}
                                                user={currentUser}
                                                serviceRoles={service.roles as Role[]}
                                                amount={displayedPrice}
                                                shopId={selectedShop}
                                                tenantId={selectedTenant} // Pass the selected tenant ID
                                                disabled={!hasSelectedShop}
                                                className="border-4 hover:bg-[#0000002d] border-[#39454f]"
                                            >
                                                Subscribe {isYearly ? "Yearly" : "Monthly"}
                                            </SubscribeButton>
                                        </>
                                    ) : (
                                        <p className="text-center font-semibold text-gray-600">
                                            {!selectedTenant
                                                ? "Please select a tenant first."
                                                : "All your shops already have this service"}
                                        </p>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
