import type { AfterChangeHook } from 'payload/types';
import { NodeSSH } from 'node-ssh';

// For convenience, define your SSH credentials (or store them in env variables)
const SSH_USER = 'admin';
const SSH_PASS = 'admin'; // e.g. password "admin"
// If you use key-based auth, you’d pass that instead

// This is the "Pi setup" function that runs commands on the remote Pi
async function configurePiZeroTierIP(zerotierIP: string): Promise<string> {
    const ssh = new NodeSSH();
    let logOutput = '';

    try {
        // 1) Connect over SSH
        await ssh.connect({
            host: zerotierIP,
            username: SSH_USER,
            password: SSH_PASS,
        });
        logOutput += `Connected to ${zerotierIP}.\n`;

        // 2) Run commands
        // Example: update, install CUPS, epson driver, etc.
        // Adjust commands to your environment’s needs

        // (A) Update system
        let result = await ssh.execCommand('sudo apt-get update && sudo apt-get upgrade -y');
        logOutput += `[Update] ${result.stdout}\n${result.stderr}\n`;

        // (B) Install CUPS and typical printing dependencies
        result = await ssh.execCommand('sudo apt-get install -y cups libcups2-dev cmake printer-driver-escpos epson-escpr');
        logOutput += `[Install] ${result.stdout}\n${result.stderr}\n`;

        // (C) Add user to lpadmin (so it can manage printers if needed)
        result = await ssh.execCommand('sudo usermod -aG lpadmin admin');
        logOutput += `[Usermod] ${result.stdout}\n${result.stderr}\n`;

        // Optionally: open up the Pi's CUPS to the entire local net. (Or your subnet.)
        // For ZeroTier, maybe you just want it listening on 631 for your private network
        // For example, you might sed + update cupsd.conf to allow remote admin.
        // This is optional & environment-specific.

        // (D) Restart CUPS
        result = await ssh.execCommand('sudo systemctl restart cups');
        logOutput += `[Restart CUPS] ${result.stdout}\n${result.stderr}\n`;

        // 3) Done
        ssh.dispose();
        logOutput += `Setup complete for IP: ${zerotierIP}.\n`;
    } catch (error: any) {
        logOutput += `Error: ${String(error.message || error)}\n`;
    }

    return logOutput;
}

// Example `afterChange` hook
export const automatePrinterSetup: AfterChangeHook = async ({ doc, operation, req }) => {
    // Only run if we're creating a new doc (or if you want to do it on update, you can remove this check)
    if (operation !== 'create') return doc;

    const zerotierIP = doc.zerotierIP;
    if (!zerotierIP) {
        // No IP => can't do SSH
        return doc;
    }

    // SSH + run commands
    const logs = await configurePiZeroTierIP(zerotierIP);

    // Optionally, store logs in the doc
    // However, note that a *hook* can't re-write the same doc in the same cycle by default.
    // You may want a separate field or do a background job approach.
    // But for demonstration, let’s do a quick, naive approach:

    try {
        const payload = req.payload;
        await payload.update({
            collection: 'printers',
            id: doc.id,
            data: {
                setupLogs: logs,
            },
        });
    } catch (e) {
        // If we fail to store logs, no big deal
        console.error('Failed to store logs:', e);
    }

    return doc;
};
