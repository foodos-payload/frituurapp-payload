// File: /src/collections/Newsletter/index.ts
import type { CollectionConfig } from 'payload'
import { generateMarketingEmail } from '../../email/generateMarketingEmail'

export const Newsletter: CollectionConfig = {
    slug: 'newsletter',
    fields: [
        {
            name: 'subject',
            type: 'text',
            required: true,
        },
        {
            name: 'message',
            type: 'richText',
        },
        {
            name: 'ctaLabel',
            type: 'text',
        },
        {
            name: 'ctaUrl',
            type: 'text',
        },
        {
            name: 'recipientEmail',
            type: 'text',
            required: true,
        },
    ],
    hooks: {
        afterChange: [
            async ({ doc, operation, req }) => {
                if (operation === 'create') {
                    try {
                        const html = await generateMarketingEmail({
                            headline: doc.subject,
                            message: doc.message, // or parse the richText as needed
                            ctaLabel: doc.ctaLabel,
                            ctaUrl: doc.ctaUrl,
                        })
                        await req.payload.sendEmail({
                            to: doc.recipientEmail,
                            from: 'marketing@your-domain.com',
                            subject: doc.subject,
                            html,
                        })
                    } catch (error) {
                        console.error('Newsletter email error:', error)
                    }
                }
            },
        ],
    },
}
