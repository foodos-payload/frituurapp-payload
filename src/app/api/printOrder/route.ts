import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { exec } from 'child_process';

export const dynamic = 'force-dynamic';

/**
 * @openapi
 * /api/printOrder:
 *   post:
 *     summary: Print an order (or any content) to a specific printer
 *     operationId: printOrder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               printerName:
 *                 type: string
 *                 description: The CUPS printer name (e.g. "my-shop-kitchen-1")
 *               content:
 *                 type: string
 *                 description: The text content to print (e.g. full order details)
 *             required:
 *               - printerName
 *               - content
 *           example:
 *             printerName: "my-shop-kitchen-1"
 *             content: "Order #123\n1x Large Fries\n1x Coke Zero"
 *     responses:
 *       '200':
 *         description: Successfully printed the content
 *       '400':
 *         description: Missing or invalid printerName/content
 *       '500':
 *         description: System error while printing
 */
export async function POST(request: NextRequest) {
    try {
        // 1) Optionally init Payload (in case you want to do any DB lookups, etc.)
        const payload = await getPayload({ config });

        // 2) Parse JSON from the request
        const { printerName, content } = await request.json();

        // 3) Validate
        if (!printerName || typeof printerName !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid printerName' },
                { status: 400 }
            );
        }
        if (!content || typeof content !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid content' },
                { status: 400 }
            );
        }

        // 4) Construct the print command
        //    - Minimal sanitization: remove suspicious characters from printerName
        const safePrinterName = printerName.replace(/[^\w\-_]/g, '');
        // For the content, escape double quotes so they don't break our echo command
        const safeContent = content.replace(/"/g, '\\"');

        const cmd = `echo "${safeContent}" | lp -d ${safePrinterName} -o raw`;

        // 5) Execute the command
        const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    return reject({ error, stderr });
                }
                resolve({ stdout, stderr });
            });
        });

        // 6) Return success
        return NextResponse.json({
            success: true,
            command: cmd,
            output: result.stdout.trim(),
            errorOutput: result.stderr.trim(),
        });
    } catch (err: any) {
        console.error('Error in printOrder:', err);
        return NextResponse.json(
            { error: err?.message || 'Unknown error while printing' },
            { status: 500 }
        );
    }
}
