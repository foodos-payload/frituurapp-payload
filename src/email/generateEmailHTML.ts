// File: /src/email/generateEmailHTML.ts
import ejs from 'ejs'
import fs from 'fs'
import juice from 'juice'
import path from 'path'

// File: /src/email/generateEmailHTML.ts
export interface GenerateEmailParams {
    headline?: string
    content?: string
    cta?: { buttonLabel?: string; url?: string }

    // Add these brand fields so EJS can embed them in the top header
    brandLogoUrl?: string
    brandHeaderColor?: string
    // etc...
}

export const generateEmailHTML = async (params: GenerateEmailParams): Promise<string> => {
    const templatePath = path.join(process.cwd(), 'src/email/template.ejs')
    const templateContent = fs.readFileSync(templatePath, 'utf8')

    const preInlined = ejs.render(templateContent, {
        ...params,
        brandLogoUrl: params.brandLogoUrl || '',
        brandHeaderColor: params.brandHeaderColor || '#dc2626',
    })

    const html = juice(preInlined)
    return html
}
