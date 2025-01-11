// File: /src/email/generateOrderSummaryEmail.ts
import { generateEmailHTML } from './generateEmailHTML'

// Extend the param interface to carry more data
export interface OrderSummaryParams {
    orderNumber: string
    itemLines: {
        name: string
        quantity: number
        price: number
        subproducts: {
            name: string
            price: number
        }[]
    }[]
    totalPrice: string
    shippingCost?: string
    fulfillmentMethod?: string
    customerDetails?: {
        firstName?: string
        lastName?: string
        email?: string
        phone?: string
        address?: string
        city?: string
        postalCode?: string
    }
    branding?: {
        logoUrl?: string
        siteTitle?: string
        headerBackgroundColor?: string
        primaryColorCTA?: string
        googleReviewUrl?: string
        tripAdvisorUrl?: string
        [key: string]: any
    }
}

// We'll generate a fancy table in HTML
export const generateOrderSummaryEmail = async (params: OrderSummaryParams) => {
    const {
        orderNumber,
        itemLines,
        totalPrice,
        shippingCost = '0.00',
        fulfillmentMethod = 'takeaway',
        customerDetails,
        branding,
    } = params

    // Build an HTML table of items
    let itemsTableRows = ''
    for (const line of itemLines) {
        // For subproducts
        let subRows = ''
        if (line.subproducts && line.subproducts.length > 0) {
            subRows = line.subproducts
                .map(
                    sp => `
            <div style="margin-left: 20px; font-size: 14px; color: #666;">
              + ${sp.name} (€${sp.price.toFixed(2)})
            </div>`
                )
                .join('')
        }

        itemsTableRows += `
      <tr>
        <td style="padding: 8px;">
          ${line.quantity} × ${line.name}
          ${subRows}
        </td>
        <td style="padding: 8px; text-align: right;">
          €${(line.price * line.quantity).toFixed(2)}
        </td>
      </tr>
    `
    }

    // A short line for the fulfillment method
    let fulfillmentStr = ''
    switch (fulfillmentMethod) {
        case 'delivery':
            fulfillmentStr = 'Delivery'
            break
        case 'takeaway':
            fulfillmentStr = 'Takeaway'
            break
        case 'dine_in':
            fulfillmentStr = 'Dine In'
            break
        default:
            fulfillmentStr = 'Pickup'
    }

    // Optionally, show shipping row if shippingCost > 0
    const shippingFloat = parseFloat(shippingCost)
    const showShippingRow = shippingFloat > 0

    // The “content” portion for the EJS
    const advancedContent = `
    <p style="margin-bottom: 1rem;">Hello ${customerDetails?.firstName || ''}, thanks for your order!</p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 8px; text-align: left;">Item</th>
          <th style="padding: 8px; text-align: right;">Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsTableRows}
      </tbody>
    </table>

    ${showShippingRow
            ? `<div style="text-align: right; margin-bottom: 0.5rem;">
             <strong>Shipping:</strong> €${shippingCost}
           </div>`
            : ''
        }

    <div style="text-align: right; margin-bottom: 1.5rem;">
      <strong style="font-size: 1.2rem;">
        Order Total: €${totalPrice}
      </strong>
    </div>

    <div style="margin-bottom: 1rem;">
      <strong>Fulfillment Method:</strong> ${fulfillmentStr}
    </div>

    ${customerDetails?.address
            ? `<div style="margin-bottom: 1rem;">
             <strong>Delivery Address:</strong><br/>
             ${customerDetails.address || ''}<br/>
             ${customerDetails.postalCode || ''} ${customerDetails.city || ''}<br/>
             ${customerDetails.phone || ''}
           </div>`
            : ''
        }

    <p style="margin-bottom: 1rem;">
      We'll contact you if there are any questions about your order. Otherwise, we look forward to seeing you soon!
    </p>

    <!-- Example for review links if branding has them -->
    ${branding?.googleReviewUrl || branding?.tripAdvisorUrl
            ? `<div style="margin-top: 2rem; padding: 1rem; background-color: #f0f0f0;">
             <p style="margin: 0 0 0.5rem;">
               Enjoyed your meal? Please consider leaving a review:
             </p>
             ${branding.googleReviewUrl
                ? `<a href="${branding.googleReviewUrl}" target="_blank" style="margin-right: 20px; text-decoration: none; color: #007bff;">Google Review</a>`
                : ''
            }
             ${branding.tripAdvisorUrl
                ? `<a href="${branding.tripAdvisorUrl}" target="_blank" style="text-decoration: none; color: #007bff;">TripAdvisor</a>`
                : ''
            }
           </div>`
            : ''
        }
  `

    // generateOrderSummaryEmail.ts snippet
    return generateEmailHTML({
        headline: branding?.siteTitle
            ? `${branding.siteTitle} – Order #${orderNumber}`
            : `Order #${orderNumber} Summary`,
        content: advancedContent,
        cta: {
            buttonLabel: 'View Order Status',
            url: `http://localhost:3000/order-status?orderId=${orderNumber}`,
        },
        brandLogoUrl: branding?.logoUrl,
        brandHeaderColor: branding?.headerBackgroundColor,
    })

}
