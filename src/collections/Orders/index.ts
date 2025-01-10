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
      async ({ data, req, operation }) => {
        // Only run this logic when creating a new order
        if (operation === 'create') {

          // 1) If kiosk => override the fulfillment_time & sub_method_label
          if (data.order_type === 'kiosk') {
            const now = new Date();
            data.fulfillment_time = now.toTimeString().slice(0, 5);
            if (data.payments && data.payments.length > 0) {
              data.payments[0].sub_method_label = 'terminal';
            }
          }

          // 2) Auto-increment: daily `tempOrdNr` + global `id`
          const today = new Date().toISOString().split('T')[0];

          // (A) Find last order *today* => set tempOrdNr
          const lastOrderToday = await req.payload.find({
            collection: 'orders',
            where: {
              tenant: { equals: data.tenant },
              shops: { in: data.shops },
              createdAt: { greater_than: `${today}T00:00:00` },
            },
            sort: '-tempOrdNr',
            limit: 1,
          });
          const lastTempOrdNr = lastOrderToday.docs[0]?.tempOrdNr || 0;
          data.tempOrdNr = lastTempOrdNr + 1;

          // (B) Find last order overall => set global `id`
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

          // 3) If `customerBarcode` => find that customer doc => set data.customer
          if (data.customerBarcode) {
            const matchingCust = await req.payload.find({
              collection: 'customers',
              where: { barcode: { equals: data.customerBarcode } },
              limit: 1,
            });
            const custDoc = matchingCust.docs[0];
            if (custDoc) {
              data.customer = custDoc.id;
            }
          }
        }

        // 4) (Optional) Cross-check each line's price with official product price
        if (data.order_details) {
          for (const od of data.order_details) {
            try {
              const productDoc = await req.payload.findByID({
                collection: 'products',
                id: od.product,
              });
              if (productDoc) {
                const officialPrice = productDoc.price_unified
                  ? productDoc.price
                  : productDoc.price;
                if (typeof od.price === 'number' && od.price !== officialPrice) {
                  throw new Error(
                    `Price mismatch for product ${productDoc.name_nl}. ` +
                    `Expected ${officialPrice}, got ${od.price}.`
                  );
                }
              } else {
                console.warn(`No product doc for ID ${od.product}, skipping cross-check.`);
              }
            } catch (err) {
              console.error(`Error verifying product price for ID ${od.product}:`, err);
              throw err;
            }
          }
        }

        // 5) Compute net & tax from the products/subproducts
        let baseSubtotal = 0;
        let totalTax = 0;

        if (data.order_details) {
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

                baseSubtotal += subLineNet;
                totalTax += subLineTax;
              }
            }

            baseSubtotal += lineNet;
            totalTax += lineTax;
          }
        }

        data.subtotalBeforeDiscount = Math.round(baseSubtotal * 100) / 100;
        data.total_tax = Math.round(totalTax * 100) / 100;
        data.subtotal = data.subtotalBeforeDiscount; // legacy

        // 6) promotionsUsed => discount entire gross
        let discount = 0;
        const gross = baseSubtotal + totalTax;

        if (data.promotionsUsed) {
          const {
            pointsUsed,
            creditsUsed,
            couponUsed,
            giftVoucherUsed,
          } = data.promotionsUsed;

          // (A) membership points => 1 point => 0.01
          if (pointsUsed && pointsUsed > 0) {
            // If we already found or had a data.customer => confirm & deduct
            if (data.customer) {
              const custDoc = await req.payload.findByID({
                collection: 'customers',
                id: data.customer,
              });
              const membership = custDoc?.memberships?.[0];
              if (!membership || (membership.points ?? 0) < pointsUsed) {
                throw new Error(
                  `Not enough points. You have ${membership?.points ?? 0}` +
                  ` but tried to use ${pointsUsed}.`
                );
              }
              // We'll deduct them later below, after we've confirmed discount
            }
            // Add to discount
            discount += pointsUsed * 0.01;
          }

          // (B) store credits => 1:1
          if (creditsUsed && creditsUsed > 0) {
            if (data.customer) {
              const foundCredit = await req.payload.find({
                collection: 'customer-credits',
                where: { customerid: { equals: data.customer } },
                limit: 1,
              });
              const creditDoc = foundCredit.docs[0];
              if (!creditDoc || creditDoc.value < creditsUsed) {
                throw new Error(
                  `Not enough store credits. You have ${creditDoc ? creditDoc.value : 0
                  } but tried to use ${creditsUsed}.`
                );
              }
              // We'll update it below
            }
            discount += creditsUsed;
          }

          // (C) couponUsed
          if (couponUsed && couponUsed.barcode) {
            try {
              const foundCoupon = await req.payload.find({
                collection: 'coupons',
                where: { barcode: { equals: couponUsed.barcode } },
                limit: 1,
              });
              const couponDoc = foundCoupon.docs[0];
              if (!couponDoc) {
                throw new Error(`Coupon ${couponUsed.barcode} not found.`);
              }

              // Store the coupon's ID
              data.promotionsUsed.couponUsed.couponId = couponDoc.id;

              // Apply discount
              if (couponUsed.value_type === 'fixed') {
                discount += (couponUsed.value || 0);
              } else if (couponUsed.value_type === 'percentage') {
                discount += gross * ((couponUsed.value || 0) / 100);
              }

              // increment uses
              const newUses = (couponDoc.uses ?? 0) + 1;
              const maxUses = couponDoc.max_uses ?? null;
              let usedFlag = couponDoc.used || false;

              if (maxUses !== null && newUses >= maxUses) {
                usedFlag = true;
              }

              // update the coupon doc
              await req.payload.update({
                collection: 'coupons',
                id: couponDoc.id,
                data: {
                  uses: newUses,
                  used: usedFlag,
                },
              });
            } catch (err) {
              console.error('Error validating coupon:', err);
              throw err;
            }
          }

          // (D) giftVoucherUsed
          if (giftVoucherUsed && giftVoucherUsed.barcode) {
            const findVoucher = await req.payload.find({
              collection: 'gift-vouchers',
              where: { barcode: { equals: giftVoucherUsed.barcode } },
              limit: 1,
            });
            const voucherDoc = findVoucher.docs[0];
            if (!voucherDoc) {
              throw new Error(`Gift voucher ${giftVoucherUsed.barcode} not found.`);
            }

            data.promotionsUsed.giftVoucherUsed.voucherId = voucherDoc.id;

            if (voucherDoc.used) {
              throw new Error(
                `Gift voucher ${giftVoucherUsed.barcode} is already used.`
              );
            }
            const nowTime = new Date().toISOString();
            if (voucherDoc.valid_from && nowTime < voucherDoc.valid_from) {
              throw new Error(
                `Gift voucher ${giftVoucherUsed.barcode} is not yet valid.`
              );
            }
            if (voucherDoc.valid_until && nowTime > voucherDoc.valid_until) {
              throw new Error(
                `Gift voucher ${giftVoucherUsed.barcode} has expired.`
              );
            }

            discount += (giftVoucherUsed.value || 0);

            // Mark voucher used
            await req.payload.update({
              collection: 'gift-vouchers',
              id: voucherDoc.id,
              data: {
                used: true,
              },
            });
          }
        }

        data.discountTotal = Math.round(discount * 100) / 100;

        // 7) final totalAfterDiscount => gross - discount
        const afterDisc = Math.max(0, gross - discount);
        data.totalAfterDiscount = Math.round(afterDisc * 100) / 100;

        // 8) Add shipping => final total
        const shipping = typeof data.shipping_cost === 'number' ? data.shipping_cost : 0;
        data.total = data.totalAfterDiscount + shipping;

        // 9) Reflect final total in the first payment line
        if (data.payments && data.payments.length > 0) {
          data.payments[0].amount = data.total;
        }

        // 10) Now that discount is final => actually deduct from membership or store credits
        if (operation === 'create' && data.promotionsUsed) {
          const { pointsUsed, creditsUsed } = data.promotionsUsed;

          // (A) membership points => if data.customer
          if (pointsUsed && pointsUsed > 0 && data.customer) {
            const custDoc = await req.payload.findByID({
              collection: 'customers',
              id: data.customer,
            });
            // Safely handle .memberships possibly undefined
            const membershipsArray = custDoc?.memberships ?? [];

            // Only if membership exists
            if (membershipsArray.length > 0) {
              const membership = membershipsArray[0];
              // Subtract used points from the first membership
              const updatedMemberships = membershipsArray.map((m: any, idx: number) => {
                if (idx === 0) {
                  return {
                    ...m,
                    points: (m.points ?? 0) - pointsUsed,
                  };
                }
                return m;
              });
              // Update the customer doc
              await req.payload.update({
                collection: 'customers',
                id: data.customer,
                data: {
                  memberships: updatedMemberships,
                },
              });
            }
          }

          // (B) store credits => if data.customer
          if (creditsUsed && creditsUsed > 0 && data.customer) {
            const foundCredit = await req.payload.find({
              collection: 'customer-credits',
              where: { customerid: { equals: data.customer } },
              limit: 1,
            });
            const creditDoc = foundCredit.docs[0];
            if (creditDoc) {
              const newVal = creditDoc.value - creditsUsed;
              await req.payload.update({
                collection: 'customer-credits',
                id: creditDoc.id,
                data: {
                  value: newVal,
                },
              });
            }
          }
        }
      },
    ],
  },

  fields: [
    // (A) Tenant + Shop scoping
    tenantField,
    shopsField,

    // (B) Optional external ID
    {
      name: 'cloudPOSId',
      type: 'number',
      label: 'CloudPOS Order ID',
      required: false,
      admin: {
        position: 'sidebar',
        description: 'The order ID used by CloudPOS if synced.',
      },
    },

    // (C) NEW: providerOrderId for Payment Providers
    {
      name: 'providerOrderId',
      type: 'text',
      label: 'Payment Provider Order ID',
      required: false,
      admin: {
        position: 'sidebar',
        description: 'Order ID from e.g. MultiSafePay, Mollie, etc.',
        readOnly: true,
      },
    },

    // (C) Auto-increment ID fields
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
        description: { en: 'Daily incremented order number.' },
        readOnly: true,
      },
    },

    // (D) Order status / type
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

    // (E) Order details array
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
        { name: 'quantity', type: 'number', required: true, label: { en: 'Quantity' } },
        { name: 'price', type: 'number', required: true, label: { en: 'Price' } },
        { name: 'tax', type: 'number', label: { en: 'Tax Rate (%)' } },
        { name: 'tax_dinein', type: 'number', label: { en: 'Dine-In Tax Rate (%)' } },
        { name: 'name_nl', type: 'text', label: { en: 'Name (NL)' } },
        { name: 'name_en', type: 'text', label: { en: 'Name (EN)' } },
        { name: 'name_de', type: 'text', label: { en: 'Name (DE)' } },
        { name: 'name_fr', type: 'text', label: { en: 'Name (FR)' } },
        {
          name: 'subproducts',
          type: 'array',
          label: { en: 'Subproducts' },
          fields: [
            { name: 'subproductId', type: 'text', label: { en: 'Subproduct ID' } },
            { name: 'name_nl', type: 'text', label: { en: 'Name (NL)' } },
            { name: 'name_en', type: 'text', label: { en: 'Name (EN)' } },
            { name: 'name_de', type: 'text', label: { en: 'Name (DE)' } },
            { name: 'name_fr', type: 'text', label: { en: 'Name (FR)' } },
            { name: 'price', type: 'number', label: { en: 'Subproduct Price' } },
            { name: 'tax', type: 'number', label: { en: 'Tax Rate (%)' } },
            { name: 'tax_dinein', type: 'number', label: { en: 'Dine-In Tax Rate (%)' } },
          ],
        },
      ],
    },

    // (F) Payments array
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
          name: 'sub_method_label',
          type: 'text',
          required: false,
          label: { en: 'Sub-method Label (e.g. MSP_Bancontact)' },
        },
        {
          name: 'amount',
          type: 'number',
          required: false,
          label: { en: 'Payment Amount' },
        },
      ],
    },

    // (G) Fulfillment info
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
    { name: 'fulfillment_date', type: 'text', label: { en: 'Fulfillment Date' } },
    { name: 'fulfillment_time', type: 'text', label: { en: 'Fulfillment Time' } },

    // (H) Customer info
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      label: { en: 'Customer' },
      required: false,
      admin: {
        description: { en: 'Link to the customer who placed this order (if known).' },
      },
    },
    {
      name: 'customerBarcode',
      type: 'text',
      required: false,
      admin: {
        description: 'If user used barcode, store it for reference.',
      },
    },
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

    // (I) Totals
    {
      name: 'shipping_cost',
      type: 'number',
      label: { en: 'Shipping Cost' },
      required: false,
      admin: {
        description: { en: 'Delivery fee if applicable.' },
        readOnly: false,
      },
    },
    {
      name: 'subtotalBeforeDiscount',
      type: 'number',
      label: { en: 'Subtotal Before Discount' },
      admin: { readOnly: true },
    },
    {
      name: 'discountTotal',
      type: 'number',
      label: { en: 'Discount Total' },
      admin: { readOnly: true },
    },
    {
      name: 'totalAfterDiscount',
      type: 'number',
      label: { en: 'Total After Discount (Net)' },
      admin: { readOnly: true },
    },
    {
      name: 'total_tax',
      type: 'number',
      label: { en: 'Total Tax' },
      admin: { readOnly: true },
    },
    {
      name: 'subtotal',
      type: 'number',
      label: { en: 'Subtotal (Legacy)' },
      admin: {
        description: { en: 'Same as net subtotal, for backward compatibility.' },
        readOnly: true,
      },
    },
    {
      name: 'total',
      type: 'number',
      label: { en: 'Final Total' },
      admin: { readOnly: true },
    },

    // (J) Promotions used
    {
      name: 'promotionsUsed',
      type: 'group',
      label: { en: 'Promotions Used' },
      fields: [
        {
          name: 'pointsUsed',
          type: 'number',
          defaultValue: 0,
          label: { en: 'Points Used' },
          admin: {
            description: { en: 'How many membership points were redeemed?' },
          },
        },
        {
          name: 'creditsUsed',
          type: 'number',
          defaultValue: 0,
          label: { en: 'Store Credits Used' },
          admin: {
            description: { en: 'How many store credits were used?' },
          },
        },
        {
          name: 'couponUsed',
          type: 'group',
          label: { en: 'Coupon Used' },
          fields: [
            { name: 'couponId', type: 'text' },
            { name: 'barcode', type: 'text' },
            { name: 'value', type: 'number' },
            // IMPORTANT: match the front-end: "value_type" = "fixed" | "percentage"
            { name: 'value_type', type: 'text' },
            { name: 'valid_from', type: 'date' },
            { name: 'valid_until', type: 'date' },
            { name: 'max_uses', type: 'number' },
            { name: 'used', type: 'checkbox' },
          ],
        },
        {
          name: 'giftVoucherUsed',
          type: 'group',
          label: { en: 'Gift Voucher Used' },
          fields: [
            { name: 'voucherId', type: 'text' },
            { name: 'barcode', type: 'text' },
            { name: 'value', type: 'number' },
            // If you also need "value_type" for gift vouchers, add it here:
            { name: 'valid_from', type: 'date' },
            { name: 'valid_until', type: 'date' },
            { name: 'used', type: 'checkbox' },
          ],
        },
      ],
    },

    {
      name: 'kioskNumber',
      type: 'number',
      label: 'Kiosk Number',
      admin: {
        description: 'If the order was placed from a kiosk, store the kiosk ID here.',
      },
    },

  ],
};
