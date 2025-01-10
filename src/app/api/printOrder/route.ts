// File: src/app/api/printOrder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { exec } from 'child_process';

// 1) Example: If you want advanced ticket formatting, replicate from your printnode.js

function simplifyText(text: string) {
    // Remove or replace special chars...
    return (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Or your accentMap approach if you prefer.
}

function buildEscposForKitchen(order: any) {
    // This is a simplified example. Copy in your logic from "printnode.js"
    // or "generateEscPosCommands(...)"

    let esc = '\x1B\x40'; // ESC @ (initialize)
    esc += '\x1B\x61\x01'; // center align
    esc += '\x1B\x21\x38'; // double height & width
    esc += `KITCHEN TICKET\nOrder #${order.id}\n\n`;

    esc += '\x1B\x21\x00'; // normal text
    esc += '\x1B\x61\x00'; // left align

    // Items
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
    esc += '\x1B\x61\x00'; // left align

    // Cut command
    esc += '\x1D\x56\x42\x00'; // Full cut
    return esc;
}

function buildEscposForCustomer(order: any) {
    let esc = '\x1B\x40'; // ESC @ (initialize)
    esc += '\x1B\x61\x01'; // center align
    esc += '\x1B\x21\x38'; // double height & width
    esc += `CUSTOMER TICKET\nOrder #${order.id}\n\n`;

    esc += '\x1B\x21\x00'; // normal text
    esc += '\x1B\x61\x00'; // left align

    // Items
    if (Array.isArray(order.order_details)) {
        for (const item of order.order_details) {
            const name = simplifyText(item.name_nl || item.name_en || 'Unnamed');
            esc += `- ${item.quantity}x ${name}\n`;
        }
    }

    esc += '\nThank you for your order!\n';
    esc += '\x1D\x56\x42\x00'; // Full cut
    return esc;
}

// 2) The main POST route logic
export async function POST(request: NextRequest) {
    try {
        // If you need Payload for DB lookups:
        const payload = await getPayload({ config });

        // Parse JSON from body
        const { printerName, ticketType, orderData } = await request.json();


        if (!printerName) {
            return NextResponse.json(
                { error: 'Missing printerName' },
                { status: 400 }
            );
        }
        if (!ticketType) {
            return NextResponse.json(
                { error: 'Missing ticketType (kitchen, customer, or both)' },
                { status: 400 }
            );
        }
        if (!orderData) {
            return NextResponse.json(
                { error: 'Missing orderData' },
                { status: 400 }
            );
        }

        // Decide which ESC/POS to build
        const typesToPrint = ticketType === 'both'
            ? ['kitchen', 'customer']
            : [ticketType];

        for (const t of typesToPrint) {
            let escpos = '';
            if (t === 'kitchen') {
                escpos = buildEscposForKitchen(orderData);
            } else if (t === 'customer') {
                escpos = buildEscposForCustomer(orderData);
            } else {
                continue;
            }

            // Escape double-quotes for our shell command
            const safeContent = escpos.replace(/"/g, '\\"');

            // Construct the command for CUPS + raw
            const safePrinter = printerName.replace(/[^\w\-_]/g, '');
            const cmd = `echo "${safeContent}" | lp -d ${safePrinter} -o raw`;
            console.log(cmd)
            // Execute
            const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        return reject({ error, stderr });
                    }
                    resolve({ stdout, stderr });
                });
            });

            console.log(`Printed ${t} ticket to ${safePrinter}. lp output:`, result.stdout, result.stderr);
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
