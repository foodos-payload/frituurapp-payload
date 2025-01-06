// File: src/app/(app)/checkout/components/CustomerDetailsForm.tsx
"use client"

import React from "react"
import AddressAutocomplete from "./AddressAutocomplete"

interface CustomerDetailsFormProps {
    fulfillmentMethod: "delivery" | "takeaway" | "dine_in" | ""
    surname: string
    setSurname: React.Dispatch<React.SetStateAction<string>>
    lastName: string
    setLastName: React.Dispatch<React.SetStateAction<string>>
    address: string
    setAddress: React.Dispatch<React.SetStateAction<string>>
    city: string
    setCity: React.Dispatch<React.SetStateAction<string>>
    postalCode: string
    setPostalCode: React.Dispatch<React.SetStateAction<string>>
    phone: string
    setPhone: React.Dispatch<React.SetStateAction<string>>
    email: string
    setEmail: React.Dispatch<React.SetStateAction<string>>

    // NEW: if there's a delivery error => show under address
    deliveryError?: string | null
}

export default function CustomerDetailsForm({
    fulfillmentMethod,
    surname,
    setSurname,
    lastName,
    setLastName,
    address,
    setAddress,
    city,
    setCity,
    postalCode,
    setPostalCode,
    phone,
    setPhone,
    email,
    setEmail,
    deliveryError,
}: CustomerDetailsFormProps) {

    function handleAddressSelected(info: {
        fullAddress: string
        lat?: number
        lng?: number
        city?: string
        postalCode?: string
    }) {
        setAddress(info.fullAddress || "")
        if (info.city) setCity(info.city)
        if (info.postalCode) setPostalCode(info.postalCode)
        // lat/lng if needed, but we mainly store them server side or in checkDistance
    }

    return (
        <div className="space-y-3">
            <h2 className="text-xl font-bold">Your Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-semibold">Surname</label>
                    <input
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        className="border p-2 rounded w-full"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold">Email (optional)</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border p-2 rounded w-full"
                    />
                </div>
            </div>

            {fulfillmentMethod === "delivery" && (
                <>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold">Last Name</label>
                            <input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="border p-2 rounded w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold">Phone</label>
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="border p-2 rounded w-full"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold">Address</label>
                        <AddressAutocomplete onAddressSelected={handleAddressSelected} />
                        {/* RIGHT HERE => if distance error => show in red */}
                        {deliveryError && (
                            <div className="text-red-700 bg-red-100 p-2 mt-2 rounded">
                                {deliveryError}
                            </div>
                        )}
                    </div>
                </>
            )}

            {fulfillmentMethod === "takeaway" && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-semibold">Last Name</label>
                        <input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="border p-2 rounded w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold">Phone</label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="border p-2 rounded w-full"
                        />
                    </div>
                </div>
            )}

            {fulfillmentMethod === "dine_in" && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-semibold">Last Name</label>
                        <input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="border p-2 rounded w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold">Phone</label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="border p-2 rounded w-full"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
