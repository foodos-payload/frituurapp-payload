// src/fields/CustomerQRField.tsx
"use client"

import React, { useCallback } from 'react'
import { useField } from '@payloadcms/ui'
import { QRCodeCanvas } from 'qrcode.react'
import { FieldClientComponent } from 'payload/types'

const CustomerQRField: FieldClientComponent = () => {
    // Because we manually call `useField`,
    // we don't need props from Payload. We'll get the "barcode" field ourselves:
    const { value: barcodeVal, setValue: setBarcodeVal } = useField<string>({
        path: 'barcode',
    })

    const handleRegenerateCode = useCallback(() => {
        const randomCode = `CUST-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
        setBarcodeVal(randomCode)
    }, [setBarcodeVal])

    if (!barcodeVal) {
        return (
            <div>
                No barcode yet.
                <button onClick={handleRegenerateCode}>Generate One</button>
            </div>
        )
    }

    return (
        <div style={{ textAlign: 'center' }}>
            <QRCodeCanvas value={barcodeVal} size={128} />
            <p>{barcodeVal}</p>

        </div>
    )
}

export default CustomerQRField
