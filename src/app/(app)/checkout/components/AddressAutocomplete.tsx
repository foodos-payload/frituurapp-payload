// File: src/app/(app)/checkout/components/AddressAutocomplete.tsx
"use client"

import React, { useState } from "react"
import PlacesAutocomplete, {
    geocodeByAddress,
    getLatLng,
} from "react-places-autocomplete"

interface AddressAutocompleteProps {
    onAddressSelected: (info: {
        fullAddress: string
        lat?: number
        lng?: number
        city?: string
        postalCode?: string
    }) => void
}

export default function AddressAutocomplete({ onAddressSelected }: AddressAutocompleteProps) {
    const [addressInput, setAddressInput] = useState("")

    async function handleSelect(addr: string) {
        setAddressInput(addr)

        const results = await geocodeByAddress(addr)
        if (!results?.[0]) return
        const place = results[0]

        let lat, lng
        try {
            const latLngObj = await getLatLng(place)
            lat = latLngObj.lat
            lng = latLngObj.lng
        } catch (err) {
        }

        // parse city, postal
        let city = ""
        let postalCode = ""
        if (place.address_components) {
            place.address_components.forEach(comp => {
                const types = comp.types
                if (types.includes("locality")) {
                    city = comp.long_name
                }
                if (types.includes("postal_code")) {
                    postalCode = comp.long_name
                }
            })
        }

        onAddressSelected({
            fullAddress: addr,
            lat,
            lng,
            city,
            postalCode,
        })
    }

    return (
        <PlacesAutocomplete
            value={addressInput}
            onChange={setAddressInput}
            onSelect={handleSelect}
        >
            {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                <div className="relative">
                    <input
                        {...getInputProps({
                            placeholder: "Search your address...",
                            className: "border p-2 w-full rounded",
                        })}
                    />
                    {loading && <div className="absolute bg-white p-2">Loading...</div>}

                    {suggestions?.length > 0 && (
                        <div className="absolute bg-white w-full shadow-md z-10">
                            {suggestions.map((sug, index) => {
                                const className = sug.active
                                    ? "p-2 bg-blue-100 cursor-pointer"
                                    : "p-2 bg-white cursor-pointer"
                                return (
                                    <div
                                        {...getSuggestionItemProps(sug, { className })}
                                        key={index}
                                    >
                                        {sug.description}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </PlacesAutocomplete>
    )
}
