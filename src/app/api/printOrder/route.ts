// File: src/app/api/printOrder/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { exec } from 'child_process';
import { mkdtemp, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

// 1) A helper to remove accents or special chars, if needed
function simplifyText(text: string) {
    return (text || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

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
    esc += '\x1B\x61\x00'; // left align

    // Cut command
    esc += '\x1D\x56\x42\x00'; // Full cut
    return esc;
}

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
    esc += '\x1D\x56\x42\x00'; // Full cut
    return esc;
}

// 4) Our main POST route
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

            // 4A) Write ESC/POS data to a temporary file as raw bytes
            //     This avoids passing the control characters via shell.
            const tempDir = await mkdtemp(join(tmpdir(), 'escpos-'));
            const filePath = join(tempDir, `ticket-${t}.bin`);
            await writeFile(filePath, escpos, 'binary');
            // or 'utf8', but 'binary' is safer for control codes

            // 4B) Use `lp` to print the file as raw
            const cmd = `lp -d ${safePrinter} -o raw "${filePath}"`;

            const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        return reject({ error, stderr });
                    }
                    resolve({ stdout, stderr });
                });
            });

            console.log(`Printed ${t} ticket on ${safePrinter}. Output:`, result.stdout, result.stderr);
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
