// File: src/app/api/printOrder/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { printBuffer } from 'node-cups'; // <-- Import from node-cups

////////////////////////////////////////////////////////////////////////////////
// 1) A helper to remove accents or special chars, if needed
function simplifyText(text: string) {
    return (text || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

////////////////////////////////////////////////////////////////////////////////
// 2) Build ESC/POS for Kitchen
function buildEscposForKitchen(order: any) {
    let esc = '\x1B\x40'; // ESC @ (initialize)
    esc += '\x1B\x61\x01'; // center align
    esc += '\x1B\x21\x38'; // double height & width
    esc += `KITCHEN TICKET\nOrder #${order.id}\n\n`;

    esc += '\x1B\x21\x00'; // normal text
    esc += '\x1B\x61\x00'; // left align

    if (Array.isArray(order.order_details)) {
        for (const item of order.order_details) {
            const name = simplifyText(item.name_nl || item.name_en || 'Unnamed');
            esc += `* ${item.quantity}x ${name}\n`;
            if (item.subproducts) {
                for (const sub of item.subproducts) {
                    esc += `   - ${sub.name_nl || ''}\n`;
                }
            }
        }
    }

    esc += `\nFulfillment Method: ${order.fulfillment_method || ''}\n`;

    // Cut command
    esc += '\x1D\x56\x42\x00'; // Full cut
    return esc;
}

////////////////////////////////////////////////////////////////////////////////
// 3) Build ESC/POS for Customer
function buildEscposForCustomer(order: any) {
    let esc = '\x1B\x40'; // ESC @ (initialize)
    esc += '\x1B\x61\x01'; // center align
    esc += '\x1B\x21\x38'; // double height & width
    esc += `CUSTOMER TICKET\nOrder #${order.id}\n\n`;

    esc += '\x1B\x21\x00'; // normal text
    esc += '\x1B\x61\x00'; // left align

    if (Array.isArray(order.order_details)) {
        for (const item of order.order_details) {
            const name = simplifyText(item.name_nl || item.name_en || 'Unnamed');
            esc += `- ${item.quantity}x ${name}\n`;
        }
    }

    esc += '\nThank you for your order!\n';

    // Cut command
    esc += '\x1D\x56\x42\x00'; // Full cut
    return esc;
}

////////////////////////////////////////////////////////////////////////////////
// 4) POST route, printing via node-cups
export async function POST(request: NextRequest) {
    try {
        const payload = await getPayload({ config });
        const { printerName, ticketType, orderData } = await request.json();

        if (!printerName) {
            return NextResponse.json({ error: 'Missing printerName' }, { status: 400 });
        }
        if (!ticketType) {
            return NextResponse.json({ error: 'Missing ticketType (kitchen, customer, or both)' }, { status: 400 });
        }
        if (!orderData) {
            return NextResponse.json({ error: 'Missing orderData' }, { status: 400 });
        }

        // Decide which ESC/POS chunks to build
        const typesToPrint = ticketType === 'both'
            ? ['kitchen', 'customer']
            : [ticketType];

        // Clean up the printer name for safety
        const safePrinter = printerName.replace(/[^\w\-_]/g, '');

        for (const t of typesToPrint) {
            let escpos = '';
            if (t === 'kitchen') {
                escpos = buildEscposForKitchen(orderData);
            } else if (t === 'customer') {
                escpos = buildEscposForCustomer(orderData);
            } else {
                // Ignore unknown ticketType
                continue;
            }

            // Convert ESC/POS string to a binary buffer
            const dataBuffer = Buffer.from(escpos, 'binary');

            // Use node-cups to print in raw mode
            // "printerOptions" can include additional CUPS options if needed
            const result = await printBuffer(dataBuffer, {
                printer: safePrinter,
                printerOptions: { raw: 'true' },
            });

            console.log(`Printed ${t} ticket on ${safePrinter}. Output: ${result.stdout || ''}`);
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error in printOrder route:', err);
        return NextResponse.json(
            { error: err?.message || 'Unknown error while printing' },
            { status: 500 }
        );
    }
}
