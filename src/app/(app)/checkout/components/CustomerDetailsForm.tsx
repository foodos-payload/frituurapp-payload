// File: src/app/(app)/checkout/components/CustomerDetailsForm.tsx
"use client";

import React from "react";
import AddressAutocomplete from "./AddressAutocomplete";

interface CustomerDetailsFormProps {
    fulfillmentMethod: "delivery" | "takeaway" | "dine_in" | "";
    surname: string;
    setSurname: React.Dispatch<React.SetStateAction<string>>;
    lastName: string;
    setLastName: React.Dispatch<React.SetStateAction<string>>;
    address: string;
    setAddress: React.Dispatch<React.SetStateAction<string>>;
    city: string;
    setCity: React.Dispatch<React.SetStateAction<string>>;
    postalCode: string;
    setPostalCode: React.Dispatch<React.SetStateAction<string>>;
    phone: string;
    setPhone: React.Dispatch<React.SetStateAction<string>>;
    email: string;
    setEmail: React.Dispatch<React.SetStateAction<string>>;

    // If there's a delivery error => show under address
    deliveryError?: string | null;
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
        fullAddress: string;
        lat?: number;
        lng?: number;
        city?: string;
        postalCode?: string;
    }) {
        setAddress(info.fullAddress || "");
        if (info.city) setCity(info.city);
        if (info.postalCode) setPostalCode(info.postalCode);
        // lat/lng if needed, but mostly handled server-side
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold mb-2">Your Details</h2>

            {/* Common fields (Surname + Email) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="">
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Surname</label>
                    <input
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        className="checkout-input"
                        placeholder="e.g. John"
                    />
                </div>

                <div className="">
                    <label className="block mb-1 text-sm font-semibold text-gray-700">
                        Email (optional)
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="checkout-input"
                        placeholder="you@example.com"
                    />
                </div>
            </div>

            {/* Delivery fields */}
            {fulfillmentMethod === "delivery" && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                            <label className="block mb-1 text-sm font-semibold text-gray-700">
                                Last Name
                            </label>
                            <input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="checkout-input"
                                placeholder="e.g. Doe"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-semibold text-gray-700">
                                Phone
                            </label>
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="checkout-input"
                                placeholder="+1 234 567 8901"
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="block mb-1 text-sm font-semibold text-gray-700">
                            Address
                        </label>
                        {/* AddressAutocomplete is a custom component that sets the address, city, postalCode */}
                        <AddressAutocomplete onAddressSelected={handleAddressSelected} />

                        {deliveryError && (
                            <div className="text-red-700 bg-red-100 p-2 mt-2 rounded">
                                {deliveryError}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Takeaway fields */}
            {fulfillmentMethod === "takeaway" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                        <label className="block mb-1 text-sm font-semibold text-gray-700">
                            Last Name
                        </label>
                        <input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="checkout-input"
                            placeholder="e.g. Doe"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-semibold text-gray-700">
                            Phone
                        </label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="checkout-input"
                            placeholder="+1 234 567 8901"
                        />
                    </div>
                </div>
            )}

            {/* Dine-in fields */}
            {fulfillmentMethod === "dine_in" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                        <label className="block mb-1 text-sm font-semibold text-gray-700">
                            Last Name
                        </label>
                        <input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="checkout-input"
                            placeholder="e.g. Doe"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-semibold text-gray-700">
                            Phone
                        </label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="checkout-input"
                            placeholder="+1 234 567 8901"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
