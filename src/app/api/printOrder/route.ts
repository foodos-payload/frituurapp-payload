import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { printBuffer } from 'node-cups';

/**
 * Remove accents or special chars if needed.
 */
function simplifyText(text: string) {
    return (text || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Build a QR code using ESC/POS commands (Epson style).
 */
function buildQrCode(data: string): string {
    let cmd = '';

    // Select model (QR Model 2)
    cmd += '\x1D\x28\x6B\x04\x00\x31\x41\x32\x00';

    // Set module size to 3
    cmd += '\x1D\x28\x6B\x03\x00\x31\x43\x03';

    // Set error correction level to 'M' (~15%)
    cmd += '\x1D\x28\x6B\x03\x00\x31\x45\x31';

    // Store data in the symbol storage area
    const len = data.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);
    cmd += '\x1D\x28\x6B' + String.fromCharCode(pL, pH) + '\x31\x50\x30' + data;

    // Print the symbol
    cmd += '\x1D\x28\x6B\x03\x00\x31\x51\x30';

    return cmd;
}

/**
 * Build ESC/POS for Kitchen ticket.
 */
function buildEscposForKitchen(order: any) {
    let esc = '\x1B\x40';
    esc += '\x1B\x61\x01'; // center
    esc += '\x1B\x21\x38'; // double
    esc += `KITCHEN TICKET\nOrder #${order.id}\n\n`;

    esc += '\x1B\x21\x00'; // normal
    esc += '\x1B\x61\x00'; // left

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
    esc += '\x1D\x56\x42\x00'; // cut
    return esc;
}

/**
 * Build ESC/POS for Customer ticket, includes a QR code to google.com
 */
function buildEscposForCustomer(order: any) {
    let esc = '\x1B\x40';
    esc += '\x1B\x61\x01'; // center
    esc += '\x1B\x21\x38'; // double
    esc += `CUSTOMER TICKET\nOrder #${order.id}\n\n`;

    esc += '\x1B\x21\x00'; // normal
    esc += '\x1B\x61\x00'; // left

    if (Array.isArray(order.order_details)) {
        for (const item of order.order_details) {
            const name = simplifyText(item.name_nl || item.name_en || 'Unnamed');
            esc += `- ${item.quantity}x ${name}\n`;
        }
    }

    esc += '\nThank you for your order!\n';

    // Insert the QR Code (centered)
    esc += '\x1B\x61\x01'; // center
    esc += buildQrCode('https://google.com');
    esc += '\x1B\x61\x00'; // left again

    // Cut the paper
    esc += '\x1D\x56\x42\x00';
    return esc;
}

/**
 * @openapi
 * /api/printOrder:
 *   post:
 *     summary: Print kitchen/customer tickets for an existing order
 *     tags:
 *       - Printing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               printerName:
 *                 type: string
 *                 description: The name of the printer to send output to
 *               ticketType:
 *                 type: string
 *                 enum: [kitchen, customer, both]
 *                 description: Which ticket style(s) to print
 *               orderData:
 *                 type: object
 *                 description: The entire order object
 *           example:
 *             printerName: "frituur-den-overkant-kitchen-main"
 *             ticketType: "both"
 *             orderData:
 *               id: 123
 *               fulfillment_method: "delivery"
 *               order_details: []
 *     responses:
 *       '200':
 *         description: Print job completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       '400':
 *         description: Missing or invalid input
 *       '500':
 *         description: Server-side error while printing
 */

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

        console.log(orderData)
        const typesToPrint = ticketType === 'both'
            ? ['kitchen', 'customer']
            : [ticketType];

        // Clean printer name
        const safePrinter = printerName.replace(/[^\w\-_]/g, '');

        for (const t of typesToPrint) {
            let escpos = '';
            if (t === 'kitchen') {
                escpos = buildEscposForKitchen(orderData);
            } else if (t === 'customer') {
                escpos = buildEscposForCustomer(orderData);
            } else {
                continue; // ignore unknown
            }

            const dataBuffer = Buffer.from(escpos, 'binary');

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
