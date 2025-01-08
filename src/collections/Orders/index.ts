import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateOrder } from './access/byTenant';
import { readAccess } from './access/readAccess';

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    create: canMutateOrder,
    delete: canMutateOrder,
    read: readAccess,
    update: canMutateOrder,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'id',
  },
  labels: {
    plural: {
      en: 'Orders',
      nl: 'Bestellingen',
      de: 'Bestellungen',
      fr: 'Commandes',
    },
    singular: {
      en: 'Order',
      nl: 'Bestelling',
      de: 'Bestellung',
      fr: 'Commande',
    },
  },

  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req, operation }) => {

        // 1) If new doc => auto-increment 'tempOrdNr' + 'id'
        if (operation === 'create') {
          const today = new Date().toISOString().split('T')[0];

          // -- Kiosk-specific overrides --
          if (data.order_type === 'kiosk') {
            const now = new Date();
            // Set fulfillment time to moment of order creation
            data.fulfillment_time = now.toTimeString().slice(0, 5);

            // Also set sub_method_label to "terminal" for the first payment line
            if (data.payments && data.payments.length > 0) {
              data.payments[0].sub_method_label = 'terminal';
            }
          }

          // (A) Find lastOrder for tempOrdNr
          const lastOrder = await req.payload.find({
            collection: 'orders',
            where: {
              tenant: { equals: data.tenant },
              shops: { in: data.shops },
              createdAt: { greater_than: `${today}T00:00:00` },
            },
            sort: '-tempOrdNr',
            limit: 1,
          });
          const lastTempOrdNr = lastOrder.docs[0]?.tempOrdNr || 0;
          data.tempOrdNr = lastTempOrdNr + 1;

          // (B) Find lastFullOrder for numeric id
          const lastFullOrder = await req.payload.find({
            collection: 'orders',
            where: {
              tenant: { equals: data.tenant },
              shops: { in: data.shops },
            },
            sort: '-id',
            limit: 1,
          });
          const lastId = lastFullOrder.docs[0]?.id ?? 0;
          data.id = lastId + 1;
        }

        // 2) Cross-check main product's price from the DB
        if (data.order_details) {
          for (const od of data.order_details) {
            try {
              // Attempt to find the real product doc
              const productDoc = await req.payload.findByID({
                collection: 'products',
                id: od.product, // The relationship ID
              });

              // If found => verify the client-provided price matches the official productDoc
              if (productDoc) {
                // Suppose your official "price" is productDoc.price if price_unified,
                // or productDoc.price_dinein / productDoc.price_takeaway depending on the order's method, etc.
                // We'll do the simplest check using productDoc.price:
                const officialPrice = productDoc.price_unified
                  ? productDoc.price // if price_unified => single price
                  : productDoc.price; // or fallback logic

                // Compare to the client's od.price:
                if (typeof od.price === 'number' && od.price !== officialPrice) {
                  throw new Error(
                    `Price mismatch for product ${productDoc.name_nl}. Expected ${officialPrice}, got ${od.price}.`
                  );
                }

                // You can also check tax if you want. If mismatch => throw error as well
                // ...
              } else {
                console.warn(
                  `Could NOT find product doc for ID ${od.product}, skipping cross-check.`
                );
              }
            } catch (err: any) {
              console.error(
                `Error verifying product price for product ID ${od.product}:`,
                err
              );
              throw err; // re-throw to stop order creation
            }
          }
        }

        // 3) (Optional) If you still want to recalc or log out totals, do it here
        //    Or you can trust the front-end's subproduct pricing.
        //    This snippet just logs them:
        if (data.order_details) {
          let subtotal = 0;
          let totalTax = 0;

          for (const od of data.order_details) {
            const lineSubtotal = (od.price ?? 0) * (od.quantity ?? 1);
            const fraction = (od.tax ?? 21) / (100 + (od.tax ?? 21));
            const lineTax = lineSubtotal * fraction;
            const lineNet = lineSubtotal - lineTax;

            if (od.subproducts) {
              for (const sub of od.subproducts) {
                const subLineSubtotal = (sub.price ?? 0) * (od.quantity ?? 1);
                const subFraction = (sub.tax ?? 21) / (100 + (sub.tax ?? 21));
                const subLineTax = subLineSubtotal * subFraction;
                const subLineNet = subLineSubtotal - subLineTax;

                subtotal += subLineNet;
                totalTax += subLineTax;
              }
            }

            subtotal += lineNet;
            totalTax += lineTax;
          }

          // Round to 2 decimals
          data.subtotal = Math.round(subtotal * 100) / 100;
          data.total_tax = Math.round(totalTax * 100) / 100;
          data.total = Math.round((subtotal + totalTax) * 100) / 100;

          console.log(
            `Final recalculated => subtotal=${data.subtotal}, totalTax=${data.total_tax}, total=${data.total}`
          );
        }

        // 4) Force the payment's amount to match `data.total`
        if (data.payments && data.payments.length > 0) {
          // If you only allow 1 payment row, you can do:
          data.payments[0].amount = data.total;

          // Or if you allow multiple payment lines and want 
          // the sum to match total, do your own sum or distribution logic.
        }
      },
    ],
  },

  fields: [
    // Tenant + Shop scoping
    tenantField,
    shopsField,
    {
      name: 'cloudPOSId',
      type: 'number', // or text
      label: 'CloudPOS Order ID',
      required: false,
      admin: {
        position: 'sidebar',
        description: 'The order ID used by CloudPOS if synced.',
      },
    },
    // Auto-increment ID fields
    {
      name: 'id',
      type: 'number',
      unique: true,
      label: { en: 'Order ID' },
      admin: {
        description: { en: 'Auto-incrementing identifier for the order.' },
        readOnly: true,
      },
    },
    {
      name: 'tempOrdNr',
      type: 'number',
      label: { en: 'Temporary Order Number' },
      admin: {
        description: { en: 'Temporary order number for daily usage.' },
        readOnly: true,
      },
    },

    // Order status / type
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending_payment',
      options: [
        { label: { en: 'Pending Payment' }, value: 'pending_payment' },
        { label: { en: 'Awaiting Preparation' }, value: 'awaiting_preparation' },
        { label: { en: 'In Preparation' }, value: 'in_preparation' },
        { label: { en: 'Ready for Pickup' }, value: 'ready_for_pickup' },
        { label: { en: 'In Delivery' }, value: 'in_delivery' },
        { label: { en: 'Complete' }, value: 'complete' },
        { label: { en: 'Cancelled' }, value: 'cancelled' },
      ],
      label: { en: 'Status' },
      admin: {
        description: { en: 'Current status of the order.' },
        readOnly: true,
      },
    },
    {
      name: 'order_type',
      type: 'select',
      options: [
        { label: 'POS', value: 'pos' },
        { label: 'Web', value: 'web' },
        { label: 'Kiosk', value: 'kiosk' },
      ],
      required: true,
      label: { en: 'Order Type' },
      admin: {
        description: { en: 'Type of order (POS, Web, or Kiosk).' },
      },
    },

    // ─────────────────────────────────────────────
    // (A) order_details array
    // ─────────────────────────────────────────────
    {
      name: 'order_details',
      type: 'array',
      label: { en: 'Order Details' },
      admin: {
        description: { en: 'List of products in the order (line items).' },
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          label: { en: 'Product' },
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          label: { en: 'Quantity' },
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          label: { en: 'Price' },
        },
        {
          name: 'tax',
          type: 'number',
        },
        {
          name: 'tax_dinein',
          type: 'number',
        },
        {
          name: 'name_nl',
          type: 'text',
          label: { en: 'Product Name (Dutch)' },
        },
        {
          name: 'name_en',
          type: 'text',
          label: { en: 'Product Name (English)' },
        },
        {
          name: 'name_de',
          type: 'text',
          label: { en: 'Product Name (German)' },
        },
        {
          name: 'name_fr',
          type: 'text',
          label: { en: 'Product Name (French)' },
        },
        {
          name: 'subproducts',
          type: 'array',
          label: { en: 'Subproducts' },
          fields: [
            {
              name: 'subproductId',
              type: 'text',
              label: { en: 'Subproduct ID' },
              admin: {
                description: {
                  en: 'An ID or code for this subproduct if needed (no relationship).',
                },
              },
            },
            {
              name: 'name_nl',
              type: 'text',
              label: { en: 'Subproduct Name (Dutch)' },
            },
            {
              name: 'name_en',
              type: 'text',
              label: { en: 'Subproduct Name (English)' },
            },
            {
              name: 'name_de',
              type: 'text',
              label: { en: 'Subproduct Name (German)' },
            },
            {
              name: 'name_fr',
              type: 'text',
              label: { en: 'Subproduct Name (French)' },
            },
            {
              name: 'price',
              type: 'number',
              required: true,
              label: { en: 'Subproduct Price' },
            },
            {
              name: 'tax',
              type: 'number',
              label: { en: 'Subproduct Tax' },
            },
            {
              name: 'tax_dinein',
              type: 'number',
              label: { en: 'Subproduct Dinein Tax' },
            },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────
    // (B) payments array
    // ─────────────────────────────────────────────
    {
      name: 'payments',
      type: 'array',
      label: { en: 'Payments' },
      admin: {
        description: { en: 'Payment details for the order.' },
      },
      fields: [
        {
          name: 'payment_method',
          type: 'relationship',
          relationTo: 'payment-methods',
          required: true,
          label: { en: 'Payment Method' },
        },
        {
          name: 'sub_method_label', // New optional text field
          type: 'text',
          required: false,
        },
        {
          name: 'amount',
          type: 'number',
          required: false,
          label: { en: 'Amount' },
        },
      ],
    },

    // ─────────────────────────────────────────────
    // (C) fulfillment fields
    // ─────────────────────────────────────────────
    {
      name: 'fulfillment_method',
      type: 'select',
      options: [
        { label: 'Delivery', value: 'delivery' },
        { label: 'Takeaway', value: 'takeaway' },
        { label: 'Dine In', value: 'dine_in' },
      ],
      label: { en: 'Fulfillment Method' },
    },
    {
      name: 'fulfillment_date',
      type: 'text',
      label: { en: 'Fulfillment Date' },
    },
    {
      name: 'fulfillment_time',
      type: 'text',
      label: { en: 'Fulfillment Time' },
    },

    // ─────────────────────────────────────────────
    // (D) customer_details
    // ─────────────────────────────────────────────
    {
      name: 'customer_details',
      type: 'group',
      label: { en: 'Customer Details' },
      fields: [
        { name: 'firstName', type: 'text', label: { en: 'First Name' } },
        { name: 'lastName', type: 'text', label: { en: 'Last Name' } },
        { name: 'email', type: 'text', label: { en: 'Email' } },
        { name: 'phone', type: 'text', label: { en: 'Phone' } },
        { name: 'address', type: 'text', label: { en: 'Address' } },
        { name: 'city', type: 'text', label: { en: 'City' } },
        { name: 'postalCode', type: 'text', label: { en: 'Postal Code' } },
      ],
    },

    // ─────────────────────────────────────────────
    // (E) Totals (read-only)
    // ─────────────────────────────────────────────
    {
      name: 'shipping_cost',
      type: 'number',
      label: { en: 'Shipping Cost' },
      required: false,
      admin: {
        description: { en: 'Delivery/shipping fee (if any).' },
        readOnly: false, // Optional: if you never want to edit manually in the admin UI
      },
    },
    {
      name: 'subtotal',
      type: 'number',
      label: { en: 'Subtotal Amount' },
      admin: { readOnly: true },
    },
    {
      name: 'total_tax',
      type: 'number',
      label: { en: 'Total Tax' },
      admin: { readOnly: true },
    },
    {
      name: 'total',
      type: 'number',
      label: { en: 'Total Amount' },
      admin: { readOnly: true },
    },
  ],
};
