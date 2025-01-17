"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SubscribeButton } from '@/components/ui/subscribe-button'
import { ManageBillingButton } from '@/components/ui/ManageBillingButton'
import type { Service, Role, Media, User, Shop } from '@/payload-types'

type ServicesClientProps = {
    services: Service[]
    currentUser?: User
}

export default function ServicesClient({ services, currentUser }: ServicesClientProps) {
    const [isYearly, setIsYearly] = useState(false)
    const [selectedShops, setSelectedShops] = useState<Record<string, string>>({})

    // Toggle monthly/yearly
    const handleToggle = () => setIsYearly((prev) => !prev)

    // Get user's shops (if any)
    const userShops = Array.isArray(currentUser?.shops) ? (currentUser.shops as Shop[]) : []

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
                {/* Toggle */}
                <div className="flex items-center space-x-2">
                    <span
                        className={`text-lg font-bold ${!isYearly ? 'text-[#1f2a37]' : 'text-gray-400'}`}
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
                ${isYearly ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                    </button>
                    <span
                        className={`text-lg font-bold ${isYearly ? 'text-[#1f2a37]' : 'text-gray-400'}`}
                    >
                        Yearly
                    </span>
                </div>

                {/* If user has a stripeCustomerId => show "Manage Billing" */}
                {currentUser?.stripeCustomerId && (
                    <ManageBillingButton userId={currentUser.id!} />
                )}
            </div>

            {/* Services Grid */}
            <div className="w-full max-w-7xl mt-10 grid md:grid-cols-3 gap-6">
                {services.map((service) => {
                    const thumbnail = service.service_thumbnail as Media

                    // Suppose service.shops is the array of shops that already have this service
                    const subscribedShopIDs = Array.isArray(service.shops)
                        ? service.shops.map((sh) => (typeof sh === 'object' ? sh.id : sh))
                        : []

                    // Filter out shops that already have this service
                    const unsubscribedShops = userShops.filter(
                        (sh) => !subscribedShopIDs.includes(sh.id),
                    )

                    // If at least one shop is in subscribedShopIDs => some shop has it
                    const isOwned = subscribedShopIDs.some(
                        (sid) => userShops.map((u) => u.id).includes(sid),
                    )

                    // The displayed price depending on monthly vs yearly
                    const displayedPrice = isYearly
                        ? service.yearly_price
                        : service.monthly_price

                    // Keep track of the user’s selection for this particular service
                    const selectedShop = selectedShops[service.id!] || ''
                    const handleShopChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                        setSelectedShops((prev) => ({
                            ...prev,
                            [service.id!]: e.target.value,
                        }))
                    }

                    const canSubscribe = unsubscribedShops.length > 0
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
                                        alt={service.title_nl || 'Service thumbnail'}
                                        width={600}
                                        height={600}
                                        className="mb-4 w-full h-48 object-cover rounded-md mix-blend-multiply"
                                    />
                                )}
                                <CardTitle className="text-2xl font-extrabold text-[#1f2a37]">
                                    {service.title_nl}
                                </CardTitle>
                                <CardDescription className="text-[#1f2a37] mt-1">
                                    {service.description_nl || 'A powerful service for your business.'}
                                </CardDescription>
                                <div className="mt-4 text-4xl font-bold text-[#1f2a37]">
                                    €{displayedPrice}
                                    <span className="ml-1 text-lg font-semibold">
                                        /{isYearly ? 'year' : 'month'}
                                    </span>
                                </div>
                            </CardHeader>

                            <CardFooter className="p-6 pt-0">
                                <div className="flex flex-row flex-wrap items-end gap-4">
                                    {/* Remove the old "Modify" button in favor of the single "Manage Billing" button */}
                                    {/* If user wants to see which shops are subscribed, they can do so in the billing portal. */}

                                    {/* 2) Subscription UI (shop selector + subscribe button) */}
                                    {canSubscribe ? (
                                        <>
                                            {/* Shop dropdown */}
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

                                            {/* Subscribe button */}
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
                                                disabled={!hasSelectedShop}
                                                className="border-4 hover:bg-[#0000002d] border-[#39454f]"
                                            >
                                                Subscribe {isYearly ? 'Yearly' : 'Monthly'}
                                            </SubscribeButton>
                                        </>
                                    ) : (
                                        <p className="text-center font-semibold text-gray-600">
                                            All your shops already have this service
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
