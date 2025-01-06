// File: /src/app/(app)/kitchen-screen/types/Order.ts

/** All possible statuses for an order in your kitchen screen */
export type OrderStatus =
    | "awaiting_preparation"
    | "in_preparation"
    | "ready_for_pickup"
    | "in_delivery"
    | "complete"
    | "done"

/** Payment method type—adjust as needed */
export interface PaymentMethod {
    provider?: string
}

/** Payment entry—for example, cash, card, etc. */
export interface PaymentEntry {
    payment_method?: PaymentMethod
    amount?: number
}

/** A single order detail line */
export interface OrderDetail {
    id: string
    quantity: number
    price?: number
    product: {
        name_nl?: string
    }
}

/** The main order object */
export interface Order {
    id: number
    fulfillment_method: string
    order_type: string
    status: OrderStatus
    tempOrdNr?: number
    order_details: OrderDetail[]
    payments?: PaymentEntry[]
    customer_note?: string
}
