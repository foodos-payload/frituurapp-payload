// File: src/app/(app)/checkout/components/CustomerDetailsForm.tsx
"use client"

import React, { Dispatch, SetStateAction } from "react"

type FulfillmentMethod = "delivery" | "takeaway" | "dine_in" | ""

interface CustomerDetailsFormProps {
    // Which method is selected: "delivery", "takeaway", or "dine_in"?
    fulfillmentMethod: FulfillmentMethod

    // Names, etc.
    surname: string
    setSurname: Dispatch<SetStateAction<string>>
    lastName: string
    setLastName: Dispatch<SetStateAction<string>>

    // For deliveries
    address: string
    setAddress: Dispatch<SetStateAction<string>>
    city: string
    setCity: Dispatch<SetStateAction<string>>
    postalCode: string
    setPostalCode: Dispatch<SetStateAction<string>>

    // For phone / email
    phone: string
    setPhone: Dispatch<SetStateAction<string>>
    email: string
    setEmail: Dispatch<SetStateAction<string>>
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
}: CustomerDetailsFormProps) {
    return (
        <div className="space-y-3">
            <h2 className="text-xl font-bold">Your Details</h2>

            {/* Always show Surname + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-semibold">Surname</label>
                    <input
                        value={surname}
                        onChange={e => setSurname(e.target.value)}
                        className="border p-2 rounded w-full"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold">Email (optional)</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="border p-2 rounded w-full"
                    />
                </div>
            </div>

            {/* If TAKEAWAY => Last Name + Phone */}
            {fulfillmentMethod === "takeaway" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-semibold">Last Name</label>
                        <input
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            className="border p-2 rounded w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold">Phone</label>
                        <input
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="border p-2 rounded w-full"
                        />
                    </div>
                </div>
            )}

            {/* If DELIVERY => show all fields */}
            {fulfillmentMethod === "delivery" && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold">Last Name</label>
                            <input
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                className="border p-2 rounded w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold">Phone</label>
                            <input
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="border p-2 rounded w-full"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold">Address</label>
                        <input
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            className="border p-2 rounded w-full"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold">City</label>
                            <input
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                className="border p-2 rounded w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold">Postal Code</label>
                            <input
                                value={postalCode}
                                onChange={e => setPostalCode(e.target.value)}
                                className="border p-2 rounded w-full"
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
