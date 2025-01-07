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

    // If there's a delivery error => show under address (red bg)
    deliveryError?: string | null;
    // If user hasn't entered address => show a notice (yellow bg)
    addressNotice?: string | null;

    emailRequired?: boolean;
    phoneRequired?: boolean;
    lastNameRequired?: boolean;

    distanceLoading?: boolean;
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
    addressNotice,
    emailRequired = false,
    phoneRequired = false,
    lastNameRequired = false,
    distanceLoading = false,

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
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold mb-2">Your Details</h2>

            {/* Common fields (Surname + Email) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">
                        Surname
                        <span className="text-red-600 ml-1">*</span>
                    </label>
                    <input
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        className="checkout-input"
                        placeholder="e.g. John"
                        // Always required or not? Up to your logic
                        required
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">
                        Email
                        {emailRequired
                            ? <span className="text-red-600 ml-1">*</span>
                            : " (optional)"}
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="checkout-input"
                        placeholder="you@example.com"
                        required={emailRequired}
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
                                {lastNameRequired && <span className="text-red-600 ml-1">*</span>}
                            </label>
                            <input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="checkout-input"
                                placeholder="e.g. Doe"
                                required={lastNameRequired}
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-semibold text-gray-700">
                                Phone
                                {phoneRequired && <span className="text-red-600 ml-1">*</span>}
                            </label>
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="checkout-input"
                                placeholder="+1 234 567 8901"
                                required={phoneRequired}
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="block mb-1 text-sm font-semibold text-gray-700">
                            Address
                        </label>
                        {/* AddressAutocomplete is a custom component that sets the address, city, postalCode */}
                        <AddressAutocomplete onAddressSelected={handleAddressSelected} />
                        {/* If distance is calculating => show a small text or spinner */}
                        {distanceLoading && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                                <svg
                                    className="animate-spin h-5 w-5 text-gray-500"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 0114.93-2H12v2H4z"
                                    ></path>
                                </svg>
                                <span>Calculating distance...</span>
                            </div>
                        )}

                        {/* If there's a "please enter address" notice => yellow background */}
                        {addressNotice && (
                            <div className="text-yellow-700 bg-yellow-100 p-2 mt-2 rounded text-md bg-yellow-50 border-l-4 border-yellow-300 p-2 my-2">
                                {addressNotice}
                            </div>
                        )}

                        {/* If there's an error (too far, min order, etc.) => red background */}
                        {deliveryError && !deliveryError.includes("€") && (
                            <div className="text-red-700 p-2 mt-2 rounded text-md bg-red-50 border-l-4 border-red-300 p-2 my-2">
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
                            {lastNameRequired && <span className="text-red-600 ml-1">*</span>}
                        </label>
                        <input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="checkout-input"
                            placeholder="e.g. Doe"
                            required={lastNameRequired}
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-semibold text-gray-700">
                            Phone
                            {phoneRequired && <span className="text-red-600 ml-1">*</span>}
                        </label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="checkout-input"
                            placeholder="+1 234 567 8901"
                            required={phoneRequired}
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
                            {lastNameRequired && <span className="text-red-600 ml-1">*</span>}
                        </label>
                        <input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="checkout-input"
                            placeholder="e.g. Doe"
                            required={lastNameRequired}
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-semibold text-gray-700">
                            Phone
                            {phoneRequired && <span className="text-red-600 ml-1">*</span>}
                        </label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="checkout-input"
                            placeholder="+1 234 567 8901"
                            required={phoneRequired}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
