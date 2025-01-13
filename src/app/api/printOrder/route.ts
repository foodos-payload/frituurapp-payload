import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { printBuffer } from 'node-cups';

/**
 * Utility to safely remove accents or special chars if needed.
 */
function simplifyText(text: string) {
    return (text || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Utility to pick the appropriate product name based on userLocale.
 * Falls back to name_nl if locale is missing or not found.
 */
function getLocalizedName(item: any, locale?: string): string {
    const safeLocale = locale || 'nl'; // fallback to 'nl'
    if (safeLocale === 'fr' && item.name_fr) return item.name_fr;
    if (safeLocale === 'en' && item.name_en) return item.name_en;
    if (safeLocale === 'de' && item.name_de) return item.name_de;
    // Default to Dutch or whichever is available
    if (item.name_nl) return item.name_nl;
    return item.name_en || item.name_fr || item.name_de || 'Unnamed';
}

/**
 * Build a QR code using ESC/POS commands (Epson style).
 * You can pass a "moduleSize" to make the QR bigger or smaller (1..8 typically).
 */
function buildQrCode(data: string, moduleSize: number = 3): string {
    let cmd = '';

    // Select model (QR Model 2)
    cmd += '\x1D\x28\x6B\x04\x00\x31\x41\x32\x00';

    // Set module size
    // moduleSize must be 1..16 for many printers, so clamp if needed
    const size = Math.max(1, Math.min(moduleSize, 16));
    cmd += '\x1D\x28\x6B\x03\x00\x31\x43' + String.fromCharCode(size);

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
 * Build ESC/POS for the Kitchen ticket.
 */
function buildEscposForKitchen(order: any): string {
    // We can check for userLocale here (if present). Fallback to 'nl' if missing.
    const locale = order.userLocale || 'nl';

    // Extract shop info (just use the first shop if it exists)
    const shop = Array.isArray(order.shops) && order.shops.length > 0
        ? order.shops[0]
        : null;
    const shopName = shop?.name || '';
    const shopAddress = shop?.address || '';

    // Payment logic
    const paymentLine = (() => {
        // If there's at least one payment
        if (Array.isArray(order.payments) && order.payments.length > 0) {
            const pm = order.payments[0];
            // If it’s "cash_on_delivery", call it "Not Paid" for the kitchen
            if (pm.payment_method?.provider === 'cash_on_delivery') {
                return 'Payment: Not Paid (cash_on_delivery)';
            }
            // Otherwise, e.g. "mollie" or "multisafepay" or anything => assume "Paid Online"
            return `Payment: ${pm.payment_method?.provider || 'Unknown'} (Paid)`;
        }
        return 'Payment: Unknown';
    })();

    // Begin ESC/POS
    let esc = '\x1B\x40';      // Init
    esc += '\x1B\x61\x01';     // Center
    esc += '\x1B\x21\x01';     // Font scaling up slightly (you can tweak \x38 for double)
    esc += simplifyText(shopName) + '\n';
    esc += simplifyText(shopAddress) + '\n';
    esc += '------------------------------\n';

    esc += '\x1B\x21\x38';     // Double font
    esc += 'KITCHEN TICKET\n';
    esc += `Order #${order.id}\n\n`;

    esc += '\x1B\x21\x00';     // normal font
    esc += '\x1B\x61\x00';     // left justification

    // Fulfillment date/time/method
    esc += `Fulfillment: ${order.fulfillment_date || ''} ${order.fulfillment_time || ''}\n`;
    esc += `Method: ${order.fulfillment_method || ''} | Type: ${order.order_type || ''}\n`;
    esc += `${paymentLine}\n`;

    // If there's customer info, show it
    if (order.customer_details?.firstName || order.customer_details?.lastName) {
        const fullName = `${order.customer_details.firstName || ''} ${order.customer_details.lastName || ''}`.trim();
        esc += `Customer: ${simplifyText(fullName)}\n`;
        if (order.customer_details.phone) {
            esc += `Phone: ${order.customer_details.phone}\n`;
        }
    }

    esc += '\n'; // blank line

    // List out items (no line-item prices on kitchen ticket)
    if (Array.isArray(order.order_details)) {
        for (const item of order.order_details) {
            const prodName = simplifyText(getLocalizedName(item, locale));
            esc += `* ${item.quantity}x ${prodName}\n`;

            // Subproducts
            if (Array.isArray(item.subproducts)) {
                for (const sub of item.subproducts) {
                    const subName = simplifyText(getLocalizedName(sub, locale));
                    const subQty = sub.quantity ?? 1;
                    esc += `   - ${subName}`;
                    if (subQty > 1) {
                        esc += ` x ${subQty}`;
                    }
                    esc += '\n';
                }
            }
        }
    }

    // Show total + whether paid
    esc += '\n';
    esc += `TOTAL: ${order.total?.toFixed(2) || '0.00'}\n`;

    esc += '\x1D\x56\x42\x00'; // Cut
    return esc;
}

/**
 * Build ESC/POS for the Customer ticket.
 */
function buildEscposForCustomer(order: any): string {
    const locale = order.userLocale || 'nl';

    // Extract shop info (just use the first shop if it exists)
    const shop = Array.isArray(order.shops) && order.shops.length > 0
        ? order.shops[0]
        : null;
    const shopName = shop?.name || '';
    const shopAddress = shop?.address || '';

    // Payment info
    let paymentMethodLabel = 'Unknown';
    let paidStatus = 'Unknown';
    if (Array.isArray(order.payments) && order.payments.length > 0) {
        const pm = order.payments[0];
        if (pm.payment_method?.provider === 'cash_on_delivery') {
            paymentMethodLabel = 'Cash On Delivery';
            paidStatus = 'Not Paid';
        } else {
            // e.g. 'mollie', 'multisafepay', etc.
            paymentMethodLabel = pm.payment_method?.provider || 'Online Payment';
            paidStatus = 'Paid';
        }
    }

    let esc = '\x1B\x40';      // Init
    esc += '\x1B\x61\x01';     // Center
    esc += '\x1B\x21\x01';     // Slightly bigger font
    esc += simplifyText(shopName) + '\n';
    esc += simplifyText(shopAddress) + '\n';
    esc += '------------------------------\n';

    esc += '\x1B\x21\x38';     // Double font
    esc += 'CUSTOMER TICKET\n';
    esc += `Order #${order.id}\n\n`;

    // Back to normal
    esc += '\x1B\x21\x00';
    esc += '\x1B\x61\x00'; // left
    esc += `Order Type: ${order.order_type || ''}\n`;
    esc += `Payment: ${paymentMethodLabel} (${paidStatus})\n`;
    esc += `Fulfillment: ${order.fulfillment_date || ''} ${order.fulfillment_time || ''}\n`;
    esc += `Method: ${order.fulfillment_method || ''}\n`;

    // If there's customer info
    if (order.customer_details?.firstName || order.customer_details?.lastName) {
        const fullName = `${order.customer_details.firstName || ''} ${order.customer_details.lastName || ''}`.trim();
        esc += `\nCustomer: ${simplifyText(fullName)}`;
        if (order.customer_details.phone) {
            esc += `\nPhone: ${order.customer_details.phone}`;
        }
        esc += '\n';
    }

    esc += '\n';

    // List items with pricing
    let subtotalCalc = 0;
    if (Array.isArray(order.order_details)) {
        for (const item of order.order_details) {
            const prodName = simplifyText(getLocalizedName(item, locale));
            const linePrice = (item.price ?? 0) * (item.quantity ?? 1);
            subtotalCalc += linePrice;

            esc += `${item.quantity}x ${prodName} @ ${item.price?.toFixed(2) || '0.00'} = ${linePrice.toFixed(2)}\n`;

            // Subproducts
            if (Array.isArray(item.subproducts)) {
                for (const sub of item.subproducts) {
                    const subName = simplifyText(getLocalizedName(sub, locale));
                    const subQty = sub.quantity ?? 1;
                    const subLinePrice = (sub.price ?? 0) * subQty;
                    subtotalCalc += subLinePrice;

                    esc += `   - ${subName}`;
                    if (subQty > 1) {
                        esc += ` x ${subQty}`;
                    }
                    esc += ` @ ${sub.price?.toFixed(2) || '0.00'} = ${subLinePrice.toFixed(2)}\n`;
                }
            }
        }
    }

    // Now show discount, shipping, tax, total, etc.
    // We'll rely on the data from order to ensure correct final amounts
    esc += '\n';

    const shipping = order.shipping_cost ?? 0;
    const discount = order.discountTotal ?? 0;
    const tax = order.total_tax ?? 0;
    const total = order.total ?? 0;

    // If you want to show a breakdown:
    esc += `Subtotal: ${order.subtotalBeforeDiscount?.toFixed(2) || subtotalCalc.toFixed(2)}\n`;
    if (discount > 0) {
        esc += `Discount: -${discount.toFixed(2)}\n`;
    }
    if (shipping > 0) {
        esc += `Shipping: +${shipping.toFixed(2)}\n`;
    }
    esc += `Tax (included): ${tax.toFixed(2)}\n`;
    esc += `TOTAL: ${total.toFixed(2)}\n\n`;

    esc += 'Thank you for your order!\n\n';

    // Insert a bigger QR Code at the bottom
    esc += '\x1B\x61\x01'; // center
    esc += buildQrCode('https://google.com', 6); // bigger size
    esc += '\x1B\x61\x00'; // left

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
