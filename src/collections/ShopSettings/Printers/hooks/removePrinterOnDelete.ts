import type { AfterDeleteHook } from 'payload/types';
import { execSync } from 'child_process';

export const removePrinterOnDelete: AfterDeleteHook = async ({ doc }) => {
    try {
        // 'printer_name' is the final printer name (e.g. "my-shop-kitchen-1")
        const printerName = doc.printer_name;
        if (!printerName) {
            return; // If no printer_name, we can't remove it
        }

        // If you need sudo password, do the same "echo password | sudo -S ..." approach
        const removeCmd = `sudo lpadmin -x ${printerName}`;
        execSync(removeCmd);
        console.log(`Successfully removed printer: ${printerName}`);
    } catch (err) {
        console.error(`Failed to remove printer:`, err);
    }
};
