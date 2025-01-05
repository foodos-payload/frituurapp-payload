// File: src/app/(app)/checkout/components/PaymentMethodSelector.tsx
"use client"

import React, { Dispatch, SetStateAction } from "react"
import { PaymentMethod } from "./CheckoutPage"

interface PaymentMethodSelectorProps {
    paymentMethods: PaymentMethod[]
    selectedPaymentId: string
    setSelectedPaymentId: Dispatch<SetStateAction<string>>
}

export default function PaymentMethodSelector({
    paymentMethods,
    selectedPaymentId,
    setSelectedPaymentId,
}: PaymentMethodSelectorProps) {
    return (
        <div className="space-y-3">
            <h2 className="text-xl font-bold">Pay With</h2>
            <div className="flex gap-3 flex-wrap">
                {paymentMethods.map(pm => (
                    <button
                        key={pm.id}
                        onClick={() => setSelectedPaymentId(pm.id)}
                        className={`
              p-3 rounded border w-[120px] text-center
              ${selectedPaymentId === pm.id
                                ? "bg-green-100 border-green-400"
                                : "bg-white border-gray-300"
                            }
            `}
                    >
                        {pm.label}
                    </button>
                ))}
            </div>
        </div>
    )
}
