// src/lib/pos/index.ts
import { CloudPOS } from './CloudPOS'
import { AbstractPOS } from './AbstractPOS'
// import { DeliverectPOS } from './DeliverectPOS'

export function createPOSInstance(
    provider: string,
    apiKey: string,
    apiSecret: string,
    options: {
        licenseName?: string
        token?: string
        shopId?: string
        tenantId?: string
    }
): AbstractPOS {
    switch (provider) {
        case 'cloudpos':
            return new CloudPOS(apiKey, apiSecret, {
                licenseName: options.licenseName || '',
                token: options.token || '',
                shopId: options.shopId || '',
                tenantId: options.tenantId || '',
            })
        // case 'deliverect':
        //   return new DeliverectPOS(apiKey, apiSecret)
        default:
            throw new Error(`Unknown POS provider: ${provider}`)
    }
}
