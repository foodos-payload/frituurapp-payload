import React, { useCallback } from 'react';
import { useField } from '@payloadcms/ui';
import { QRCodeCanvas } from 'qrcode.react';
import { PayloadFieldComponent } from '@/types/PayloadFieldComponent';

const CustomerQRField: PayloadFieldComponent = () => {
    const { value: barcodeVal, setValue: setBarcodeVal } = useField<string>({
        path: 'barcode',
    });

    const handleRegenerateCode = useCallback(() => {
        const randomCode = `CUST-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
        setBarcodeVal(randomCode);
    }, [setBarcodeVal]);

    if (!barcodeVal) {
        return (
            <div>
                No barcode yet.
                <button onClick={handleRegenerateCode}>Generate One</button>
            </div>
        );
    }

    return (
        <div style={{ textAlign: 'center' }}>
            <QRCodeCanvas value={barcodeVal} size={128} />
            <p>{barcodeVal}</p>
        </div>
    );
};

export default CustomerQRField;
