import type { CollectionAfterChangeHook } from 'payload/types';
import { execSync } from 'child_process';

export const automatePrinterSetup: CollectionAfterChangeHook = async ({
    doc,
    operation,
    req,
}) => {
    // We only want to run on create or update
    if (operation !== 'create' && operation !== 'update') {
        return;
    }

    const queueName = doc.queue_name;
    const zerotierIP = doc.zerotierIP;
    const printerType = doc.printer_type; // 'kitchen' or 'kiosk'
    const uniqueID = doc.unique_id;
    const shopIDs = Array.isArray(doc.shops) ? doc.shops : [];

    // We cannot proceed if required fields are missing
    if (!queueName || !zerotierIP || !printerType || !uniqueID || shopIDs.length === 0) {
        return;
    }

    // For simplicity, take the first shop ID
    const [firstShopID] = shopIDs;
    if (!firstShopID) {
        return;
    }

    // Fetch the shop doc to get its slug
    const shop = await req.payload.findByID({
        collection: 'shops',
        id: firstShopID,
    });

    // If no shop found or no slug, bail out
    if (!shop || !shop.slug) {
        return;
    }

    const shopSlug = shop.slug;

    // Build final printer name: e.g. "my-shop-kiosk-1"
    const finalPrinterName = `${shopSlug}-${printerType}-${uniqueID}`;

    // Example command: 
    // sudo lpadmin -p my-shop-kiosk-1 -E -v ipp://10.1.1.5:631/printers/Queue123 -m raw
    const cmd = `sudo lpadmin -p ${finalPrinterName} -E -v ipp://${zerotierIP}:631/printers/${queueName} -m raw`;

    try {
        execSync(cmd);
        console.log(`Successfully ran: ${cmd}`);
    } catch (err) {
        console.error(`Failed to run command: ${cmd}`, err);
    }
};
