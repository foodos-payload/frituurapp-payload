// File: src/collections/Orders/index.ts

import type { CollectionConfig } from 'payload';

// Keep existing imports
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker'; // import field-level as well
import { generateOrderSummaryEmail } from '../../email/generateOrderSummaryEmail';

import { createPOSInstance } from '@/lib/pos';
import { CloudPOS } from '@/lib/pos/CloudPOS';

export const Orders: CollectionConfig = {
  slug: 'orders',

  // ---------------------------
  // Collection-level Access
  // ---------------------------
  access: {
    create: hasPermission('orders', 'create'),
    delete: hasPermission('orders', 'delete'),
    read: hasPermission('orders', 'read'),
    update: hasPermission('orders', 'update'),
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
        if (operation !== 'create') {
          return;
        }

        if (!data.userLocale) {
          data.userLocale = 'nl';
        }

        // 1) Kiosk => override fulfillment_time & sub_method_label
        if (data.order_type === 'kiosk') {
          const now = new Date();
          data.fulfillment_time = now.toTimeString().slice(0, 5);
          if (data.payments && data.payments.length > 0) {
            data.payments[0].sub_method_label = 'terminal';
          }
        }

        // 2) Timeslot concurrency check => skip if kiosk
        if (data.order_type === 'kiosk') {
          console.log('[orders.beforeChange] kiosk => skipping concurrency checks.');
        } else {
          const methodType = data.fulfillment_method; // e.g. 'delivery'
          const dateStr = data.fulfillment_date;      // e.g. '2025-01-10'
          const timeStr = data.fulfillment_time;      // e.g. '09:15'

          if (methodType && dateStr && timeStr) {
            // (A) Find the relevant fulfillment-method doc
            const methodDoc = await req.payload.find({
              collection: 'fulfillment-methods',
              where: {
                method_type: { equals: methodType },
                shops: { in: data.shops },
              },
              limit: 1,
            });
            const foundMethod = methodDoc.docs[0];
            if (!foundMethod) {
              throw new Error(`Fulfillment method ${methodType} not found for this shop`);
            }

            const isShared = foundMethod.settings?.shared_booked_slots === true;

            // (B) Convert dateStr => dayOfWeek => find timeslot
            const [yyyy, mm, dd] = dateStr.split('-').map(Number);
            const dt = new Date(Date.UTC(yyyy, mm - 1, dd, 12));
            const dayNumber = dt.getUTCDay() === 0 ? 7 : dt.getUTCDay(); // 1..7

            const dayIndexMap: Record<string, string> = {
              '1': 'monday',
              '2': 'tuesday',
              '3': 'wednesday',
              '4': 'thursday',
              '5': 'friday',
              '6': 'saturday',
              '7': 'sunday',
            };
            const dayKey = dayIndexMap[String(dayNumber)];

            const timeslotsResult = await req.payload.find({
              collection: 'timeslots',
              where: {
                shops: { in: data.shops },
                method_id: { equals: foundMethod.id },
              },
              limit: 50,
              depth: 0,
            });

            function toMinutes(hhmm: string) {
              const [h, m] = hhmm.split(':').map(Number);
              return (h || 0) * 60 + (m || 0);
            }
            const requestedMinutes = toMinutes(timeStr);

            let matchedMaxOrders: number | null = null;

            for (const doc of timeslotsResult.docs) {
              const ranges = (doc as any).week?.[dayKey];
              if (!ranges) continue;

              for (const tr of ranges) {
                if (!tr.status) continue; // skip disabled
                const startMins = toMinutes(tr.start_time);
                const endMins = toMinutes(tr.end_time);

                if (requestedMinutes >= startMins && requestedMinutes < endMins) {
                  matchedMaxOrders = tr.max_orders || 5;
                  break;
                }
              }
              if (matchedMaxOrders !== null) break;
            }

            if (matchedMaxOrders === null) {
              throw new Error(
                `No matching timeslot range found for method=${methodType} at ${dateStr} ${timeStr}. Possibly closed?`
              );
            }

            // (C) If shared => also check usage from other shared methods
            const methodTypesToCheck: string[] = [methodType];
            if (isShared) {
              const sharedOnes = await req.payload.find({
                collection: 'fulfillment-methods',
                where: {
                  shops: { in: data.shops },
                  'settings.shared_booked_slots': { equals: true },
                },
                limit: 50,
              });
              const sharedTypes = sharedOnes.docs.map((m) => m.method_type);
              for (const st of sharedTypes) {
                if (!methodTypesToCheck.includes(st)) {
                  methodTypesToCheck.push(st);
                }
              }
            }

            // (D) Count existing orders with same date/time + method(s)
            const usageCheck = await req.payload.find({
              collection: 'orders',
              where: {
                tenant: { equals: data.tenant },
                shops: { in: data.shops },
                fulfillment_date: { equals: dateStr },
                fulfillment_time: { equals: timeStr },
                fulfillment_method: { in: methodTypesToCheck },
                status: { not_equals: 'cancelled' },
              },
              limit: 200,
              depth: 0,
            });

            if (usageCheck.docs.length >= matchedMaxOrders) {
              throw new Error(`Sorry, that timeslot is fully booked! Please pick another time.`);
            }
          }
        }

        // 3) Auto-increment: daily `tempOrdNr` + global `id`
        const today = new Date().toISOString().split('T')[0];

        const shopID = Array.isArray(data.shops) ? data.shops[0] : data.shops;
        // or if there's guaranteed exactly one shop, just use data.shops directly.

        const lastOrderToday = await req.payload.find({
          collection: 'orders',
          where: {
            shops: { equals: shopID },
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

        // (C) If `customerBarcode` => find that customer doc => set data.customer
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

        // 4) Optional cross-check line prices
        if (data.order_details) {
          for (const od of data.order_details) {
            try {
              const productDoc = await req.payload.findByID({
                collection: 'products',
                id: od.product,
              });
              if (productDoc) {
                const officialPrice = productDoc.price_unified ? productDoc.price : productDoc.price;
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
                const subQty = sub.quantity ?? 1;
                const subLineSubtotal = (sub.price ?? 0) * (od.quantity ?? 1) * subQty;
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
          const { pointsUsed, creditsUsed, couponUsed, giftVoucherUsed } = data.promotionsUsed;

          // (A) membership points => 1 point => €0.01
          if (pointsUsed && pointsUsed > 0) {
            if (data.customer) {
              const custDoc = await req.payload.findByID({
                collection: 'customers',
                id: data.customer,
              });
              const membership = custDoc?.memberships?.[0];
              if (!membership || (membership.points ?? 0) < pointsUsed) {
                throw new Error(
                  `Not enough points. You have ${membership?.points ?? 0} but tried to use ${pointsUsed}.`
                );
              }
            }
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

              data.promotionsUsed.couponUsed.couponId = couponDoc.id;

              if (couponUsed.value_type === 'fixed') {
                discount += couponUsed.value || 0;
              } else if (couponUsed.value_type === 'percentage') {
                discount += gross * ((couponUsed.value || 0) / 100);
              }

              const newUses = (couponDoc.uses ?? 0) + 1;
              const maxUses = couponDoc.max_uses ?? null;
              let usedFlag = couponDoc.used || false;

              if (maxUses !== null && newUses >= maxUses) {
                usedFlag = true;
              }

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

            discount += giftVoucherUsed.value || 0;

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

        // 7) final totalAfterDiscount
        const afterDisc = Math.max(0, gross - discount);
        data.totalAfterDiscount = Math.round(afterDisc * 100) / 100;

        // 8) shipping => final total
        const shipping = typeof data.shipping_cost === 'number' ? data.shipping_cost : 0;
        data.total = data.totalAfterDiscount + shipping;

        // 8.5) Tipping
        if (data.tippingUsed && data.tippingUsed.type !== 'none') {
          let tipValue = 0;
          const tipType = data.tippingUsed.type;
          const tipAmount = data.tippingUsed.amount || 0;

          if (tipType === 'fixed') {
            tipValue = tipAmount;
          } else if (tipType === 'percentage') {
            tipValue = data.total * (tipAmount / 100);
          } else if (tipType === 'round_up') {
            const currentTotal = data.total;
            tipValue = Math.ceil(currentTotal) - currentTotal;
          }

          data.tippingUsed.actualTip = Math.round(tipValue * 100) / 100;
          data.tippingUsed.amount = data.tippingUsed.actualTip;
          data.total += data.tippingUsed.actualTip;
        }

        // 9) Reflect final total in first payment line
        if (data.payments && data.payments.length > 0) {
          data.payments[0].amount = data.total;
        }

        // 10) Deduct membership points / store credits
        if (data.promotionsUsed) {
          const { pointsUsed, creditsUsed } = data.promotionsUsed;

          // (A) membership points => if data.customer
          if (pointsUsed && pointsUsed > 0 && data.customer) {
            const custDoc = await req.payload.findByID({
              collection: 'customers',
              id: data.customer,
            });
            const membershipsArray = custDoc?.memberships ?? [];

            if (membershipsArray.length > 0) {
              const updatedMemberships = membershipsArray.map((m: any, idx: number) => {
                if (idx === 0) {
                  return {
                    ...m,
                    points: (m.points ?? 0) - pointsUsed,
                  };
                }
                return m;
              });
              await req.payload.update({
                collection: 'customers',
                id: data.customer,
                data: { memberships: updatedMemberships },
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
                data: { value: newVal },
              });
            }
          }
        }
      },
    ],
    afterChange: [
      // 1) Print Logic
      async ({ doc, previousDoc, operation, req }) => {
        // A) NEW order with a non-pending status
        if (operation === 'create' && doc.status !== 'pending_payment') {
          try {
            // kiosk logic
            if (doc.order_type === 'kiosk') {
              if (!doc.kioskNumber) {
                console.warn('Order is kiosk-type, but no kioskNumber found; skipping kiosk print.');
                return;
              }

              const shopIDs = Array.isArray(doc.shops)
                ? doc.shops.map((s: any) => (typeof s === 'object' ? s.id : s))
                : [doc.shops];

              if (!shopIDs.length) {
                console.warn('No shops found on this kiosk order; skipping kiosk print.');
                return;
              }

              const kioskPrinters = await req.payload.find({
                collection: 'printers',
                where: {
                  and: [
                    { shops: { in: shopIDs } },
                    { printer_type: { equals: 'kiosk' } },
                    { print_enabled: { equals: true } },
                  ],
                },
                limit: 50,
              });

              for (const p of kioskPrinters.docs) {
                try {
                  const nameParts = p.printer_name?.split('-') || [];
                  const lastPart = nameParts[nameParts.length - 1];

                  if (String(lastPart) === String(doc.kioskNumber)) {
                    // Retry logic (5 attempts)
                    for (let attempt = 1; attempt <= 5; attempt++) {
                      try {
                        await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/printOrder`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            printerName: p.printer_name,
                            ticketType: 'customer',
                            orderData: doc,
                          }),
                        });
                        break;
                      } catch (err) {
                        console.error(
                          `Error printing kiosk ticket to printer ${p.printer_name}, attempt ${attempt}/5:`,
                          err
                        );
                        if (attempt === 5) {
                          throw err;
                        } else {
                          await new Promise((resolve) => setTimeout(resolve, 15000));
                        }
                      }
                    }
                  }
                } catch (kioskErr) {
                  console.error(`Error printing kiosk ticket to printer ${p.printer_name}:`, kioskErr);
                }
              }
            }

            // KITCHEN LOGIC
            const shopIDs = Array.isArray(doc.shops)
              ? doc.shops.map((s: any) => (typeof s === 'object' ? s.id : s))
              : [doc.shops];

            if (!shopIDs.length) {
              console.warn('No shops found on this order; skipping kitchen print.');
              return;
            }

            const kitchenPrinters = await req.payload.find({
              collection: 'printers',
              where: {
                and: [
                  { shops: { in: shopIDs } },
                  { printer_type: { equals: 'kitchen' } },
                  { print_enabled: { equals: true } },
                ],
              },
              limit: 50,
            });

            for (const p of kitchenPrinters.docs) {
              try {
                // Always print the "kitchen" ticket
                for (let attempt = 1; attempt <= 5; attempt++) {
                  try {
                    await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/printOrder`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        printerName: p.printer_name,
                        ticketType: 'kitchen',
                        orderData: doc,
                      }),
                    });
                    break;
                  } catch (err) {
                    console.error(
                      `Error printing kitchen ticket to printer ${p.printer_name}, attempt ${attempt}/5:`,
                      err
                    );
                    if (attempt === 5) {
                      throw err;
                    } else {
                      await new Promise((resolve) => setTimeout(resolve, 15000));
                    }
                  }
                }

                if (p?.customer_enabled === true) {
                  for (let attempt = 1; attempt <= 5; attempt++) {
                    try {
                      await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/printOrder`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          printerName: p.printer_name,
                          ticketType: 'customer',
                          orderData: doc,
                        }),
                      });
                      break;
                    } catch (err) {
                      console.error(
                        `Error printing customer copy to printer ${p.printer_name}, attempt ${attempt}/5:`,
                        err
                      );
                      if (attempt === 5) {
                        throw err;
                      } else {
                        await new Promise((resolve) => setTimeout(resolve, 15000));
                      }
                    }
                  }
                }
              } catch (printErr) {
                console.error(`Error printing to printer ${p.printer_name}:`, printErr);
              }
            }
          } catch (err) {
            console.error('Error in order afterChange print hook (create):', err);
          }
          return; // Stop here for the create case
        }

        // B) EXISTING order updated: pending_payment -> something else
        if (operation === 'update') {
          const oldStatus = previousDoc?.status;
          const newStatus = doc.status;

          if (oldStatus === 'pending_payment' && newStatus !== 'pending_payment') {
            try {
              // ─────────────────────────────────────────────────────────────
              // (A) Kiosk logic
              // ─────────────────────────────────────────────────────────────
              if (doc.order_type === 'kiosk') {
                if (!doc.kioskNumber) {
                  console.warn('Order is kiosk-type, but no kioskNumber found; skipping kiosk print.');
                  return;
                }

                const shopIDs = Array.isArray(doc.shops)
                  ? doc.shops.map((s: any) => (typeof s === 'object' ? s.id : s))
                  : [doc.shops];

                if (!shopIDs.length) {
                  console.warn('No shops found on this kiosk order; skipping kiosk print.');
                  return;
                }

                const kioskPrinters = await req.payload.find({
                  collection: 'printers',
                  where: {
                    and: [
                      { shops: { in: shopIDs } },
                      { printer_type: { equals: 'kiosk' } },
                      { print_enabled: { equals: true } },
                    ],
                  },
                  limit: 50,
                });

                for (const p of kioskPrinters.docs) {
                  try {
                    const nameParts = p.printer_name?.split('-') || [];
                    const lastPart = nameParts[nameParts.length - 1];
                    if (String(lastPart) === String(doc.kioskNumber)) {
                      // Retry logic (5 attempts)
                      for (let attempt = 1; attempt <= 5; attempt++) {
                        try {
                          await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/printOrder`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              printerName: p.printer_name,
                              ticketType: 'customer',
                              orderData: doc,
                            }),
                          });
                          break;
                        } catch (err) {
                          console.error(
                            `Error printing kiosk ticket to printer ${p.printer_name}, attempt ${attempt}/5:`,
                            err
                          );
                          if (attempt === 5) {
                            throw err;
                          } else {
                            await new Promise((resolve) => setTimeout(resolve, 15000));
                          }
                        }
                      }
                    }
                  } catch (kioskErr) {
                    console.error(`Error printing kiosk ticket to printer ${p.printer_name}:`, kioskErr);
                  }
                }
              }

              // ─────────────────────────────────────────────────────────────
              // (B) Kitchen logic
              // ─────────────────────────────────────────────────────────────
              const shopIDs = Array.isArray(doc.shops)
                ? doc.shops.map((s: any) => (typeof s === 'object' ? s.id : s))
                : [doc.shops];

              if (!shopIDs.length) {
                console.warn('No shops found on this order; skipping print logic.');
                return;
              }

              const printers = await req.payload.find({
                collection: 'printers',
                where: {
                  and: [
                    { shops: { in: shopIDs } },
                    { printer_type: { equals: 'kitchen' } },
                    { print_enabled: { equals: true } },
                  ],
                },
                limit: 50,
              });

              for (const p of printers.docs) {
                try {
                  // Always print the "kitchen" ticket
                  for (let attempt = 1; attempt <= 5; attempt++) {
                    try {
                      await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/printOrder`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          printerName: p.printer_name,
                          ticketType: 'kitchen',
                          orderData: doc,
                        }),
                      });
                      break;
                    } catch (err) {
                      console.error(
                        `Error printing kitchen ticket to printer ${p.printer_name}, attempt ${attempt}/5:`,
                        err
                      );
                      if (attempt === 5) {
                        throw err;
                      } else {
                        await new Promise((resolve) => setTimeout(resolve, 15000));
                      }
                    }
                  }

                  // If this printer is also set to print a customer copy
                  if (p?.customer_enabled === true) {
                    for (let attempt = 1; attempt <= 5; attempt++) {
                      try {
                        await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/printOrder`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            printerName: p.printer_name,
                            ticketType: 'customer',
                            orderData: doc,
                          }),
                        });
                        break;
                      } catch (err) {
                        console.error(
                          `Error printing customer copy to printer ${p.printer_name}, attempt ${attempt}/5:`,
                          err
                        );
                        if (attempt === 5) {
                          throw err;
                        } else {
                          await new Promise((resolve) => setTimeout(resolve, 15000));
                        }
                      }
                    }
                  }
                } catch (printErr) {
                  console.error(`Error printing to printer ${p.printer_name}:`, printErr);
                }
              }

              // ─────────────────────────────────────────────────────────────
              // (C) CloudPOS Push Logic
              // ─────────────────────────────────────────────────────────────
              console.log(`[CloudPOS] Order status changed from "pending_payment" to "${newStatus}"`);

              const posResult = await req.payload.find({
                collection: 'pos',
                where: {
                  and: [
                    { active: { equals: true } },
                    { shop: { equals: doc.shops[0] } },
                  ],
                },
                limit: 10,
              });

              for (const posDoc of posResult.docs) {
                const { provider, apiKey, apiSecret, licenseName, token, syncOrders } = posDoc;

                console.log(`[pushOrder] Found POS doc ${posDoc.id} for shop="${doc.shops[0]}". syncOrders=${syncOrders}`);

                // If syncOrders is 'off', skip
                if (syncOrders === 'off') {
                  console.log(`syncOrders is OFF => skipping push...`);
                  continue;
                }

                // Only push if provider is "cloudpos" and syncOrders is set to "to-cloudpos"
                if (provider === 'cloudpos' && syncOrders === 'to-cloudpos') {
                  const cloudPOSInstance = createPOSInstance(
                    'cloudpos',
                    apiKey ?? '',
                    apiSecret ?? '',
                    {
                      licenseName: licenseName ?? '',
                      token: token ?? '',
                      shopId: doc.shops[0],
                      tenantId: typeof doc.tenant === 'string' ? doc.tenant : undefined,
                    }
                  ) as CloudPOS;

                  const newCloudPOSId = await cloudPOSInstance.pushLocalOrderToCloudPOS(doc.id);
                  console.log(`Pushed local order=${doc.id} => CloudPOS ID=${newCloudPOSId}`);

                  // Update the order document with the CloudPOS ID
                  await req.payload.update({
                    collection: 'orders',
                    id: doc.id,
                    data: { cloudPOSId: newCloudPOSId },
                  });
                } else {
                  console.log(`Provider="${provider}" or syncOrders="${syncOrders}" => no push.`);
                }
              }

            } catch (err) {
              console.error('Error in order afterChange hook (update):', err);
            }
          }
        }
      },

      // 2) Email Logic
      async ({ doc, operation, req }) => {
        if (operation === 'create') {
          try {
            let branding: any = {};

            // 1) If there's at least one shop => use the first
            if (doc.shops && doc.shops.length > 0) {
              const firstShopId = doc.shops[0]?.id ?? doc.shops[0];
              if (firstShopId) {
                const shopDoc = await req.payload.findByID({
                  collection: 'shops',
                  id: firstShopId,
                });
                if (shopDoc) {
                  // find shop-branding doc
                  const brandingRes = await req.payload.find({
                    collection: 'shop-branding',
                    where: { shops: { in: [shopDoc.id] } },
                    depth: 2,
                    limit: 1,
                  });
                  const brandingDoc = brandingRes.docs[0] || null;
                  branding = {
                    siteTitle: brandingDoc?.siteTitle || shopDoc.name,
                    logoUrl: brandingDoc?.siteLogo,
                    headerBackgroundColor: brandingDoc?.headerBackgroundColor,
                    primaryColorCTA: brandingDoc?.primaryColorCTA,
                    googleReviewUrl: brandingDoc?.googleReviewUrl,
                    tripAdvisorUrl: brandingDoc?.tripAdvisorUrl,
                  };
                }
              }
            }

            // 2) Build itemLines
            const orderDetails = doc.order_details || [];
            const itemLines = orderDetails.map((detail: any) => {
              const subprods = (detail.subproducts || []).map((sp: any) => ({
                name: sp.name_nl || 'Unnamed subproduct',
                price: sp.price ?? 0,
              }));
              return {
                name: detail.name_nl || detail.product?.name_nl || 'Unnamed product',
                quantity: detail.quantity ?? 1,
                price: detail.price ?? 0,
                subproducts: subprods,
              };
            });

            // 3) Generate email HTML
            const html = await generateOrderSummaryEmail({
              orderNumber: doc.id.toString(),
              itemLines,
              totalPrice: doc.total?.toFixed(2) || '0.00',
              shippingCost: doc.shipping_cost?.toFixed(2) || '0.00',
              fulfillmentMethod: doc.fulfillment_method,
              customerDetails: doc.customer_details || {},
              branding,
            });

            // 4) Send the email
            await req.payload.sendEmail({
              to: doc.customer_details?.email || 'no-email-provided@example.com',
              from: 'info@frituurapp.be',
              subject: `Your Order #${doc.id}`,
              html,
            });
          } catch (err) {
            console.error('Error sending order summary email:', err);
          }
        }
      },
    ],
  },

  fields: [
    // auto-increment ID
    {
      name: 'id',
      type: 'number',
      label: { en: 'Order ID' },
      admin: {
        description: { en: 'Auto-incrementing identifier for the order.' },
        readOnly: true,
      },
      access: {
        read: hasFieldPermission('orders', 'id', 'read'),
        update: hasFieldPermission('orders', 'id', 'update'),
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
      access: {
        read: hasFieldPermission('orders', 'tempOrdNr', 'read'),
        update: hasFieldPermission('orders', 'tempOrdNr', 'update'),
      },
    },

    // status
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
        position: 'sidebar',
      },
      access: {
        read: hasFieldPermission('orders', 'status', 'read'),
        update: hasFieldPermission('orders', 'status', 'update'),
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
      access: {
        read: hasFieldPermission('orders', 'order_type', 'read'),
        update: hasFieldPermission('orders', 'order_type', 'update'),
      },
    },

    // order_details array
    {
      type: 'collapsible',
      label: {
        en: 'Product Info',
        nl: 'Productinfo',
        de: 'Produktinfo',
        fr: 'Informations Produit',
      },
      admin: {
        initCollapsed: true, // or false, as you wish
      },
      fields: [
        {
          name: 'order_details',
          type: 'array',
          label: {
            en: 'Order Details',
            nl: 'Bestellingsdetails',
            de: 'Bestelldetails',
            fr: 'Détails de la Commande',
          },
          admin: {
            description: {
              en: 'List of products in the order (line items).',
              nl: 'Lijst met producten in de bestelling (artikelen).',
              de: 'Liste der Produkte in der Bestellung (Posten).',
              fr: 'Liste des produits dans la commande (articles).',
            },
          },
          fields: [
            {
              name: 'product',
              type: 'relationship',
              relationTo: 'products',
              required: true,
              label: {
                en: 'Product',
                nl: 'Product',
                de: 'Produkt',
                fr: 'Produit',
              },
              access: {
                read: hasFieldPermission('orders', 'order_details.product', 'read'),
                update: hasFieldPermission('orders', 'order_details.product', 'update'),
              },
            },
            {
              name: 'quantity',
              type: 'number',
              required: true,
              label: {
                en: 'Quantity',
                nl: 'Aantal',
                de: 'Menge',
                fr: 'Quantité',
              },
              access: {
                read: hasFieldPermission('orders', 'order_details.quantity', 'read'),
                update: hasFieldPermission('orders', 'order_details.quantity', 'update'),
              },
            },
            {
              name: 'price',
              type: 'number',
              required: true,
              label: {
                en: 'Price',
                nl: 'Prijs',
                de: 'Preis',
                fr: 'Prix',
              },
              access: {
                read: hasFieldPermission('orders', 'order_details.price', 'read'),
                update: hasFieldPermission('orders', 'order_details.price', 'update'),
              },
            },
            {
              name: 'tax',
              type: 'number',
              label: {
                en: 'Tax Rate (%)',
                nl: 'Btw (%)',
                de: 'MwSt (%)',
                fr: 'TVA (%)',
              },
              access: {
                read: hasFieldPermission('orders', 'order_details.tax', 'read'),
                update: hasFieldPermission('orders', 'order_details.tax', 'update'),
              },
            },
            {
              name: 'tax_dinein',
              type: 'number',
              label: {
                en: 'Dine-In Tax Rate (%)',
                nl: 'Btw voor Eten Ter Plaatse (%)',
                de: 'Vor-Ort MwSt (%)',
                fr: 'TVA Sur Place (%)',
              },
              access: {
                read: hasFieldPermission('orders', 'order_details.tax_dinein', 'read'),
                update: hasFieldPermission('orders', 'order_details.tax_dinein', 'update'),
              },
            },
            {
              name: 'name_nl',
              type: 'text',
              label: {
                en: 'Name (NL)',
                nl: 'Naam (NL)',
                de: 'Name (NL)',
                fr: 'Nom (NL)',
              },
              access: {
                read: hasFieldPermission('orders', 'order_details.name_nl', 'read'),
                update: hasFieldPermission('orders', 'order_details.name_nl', 'update'),
              },
            },
            {
              name: 'name_en',
              type: 'text',
              label: {
                en: 'Name (EN)',
                nl: 'Naam (EN)',
                de: 'Name (EN)',
                fr: 'Nom (EN)',
              },
              access: {
                read: hasFieldPermission('orders', 'order_details.name_en', 'read'),
                update: hasFieldPermission('orders', 'order_details.name_en', 'update'),
              },
            },
            {
              name: 'name_de',
              type: 'text',
              label: {
                en: 'Name (DE)',
                nl: 'Naam (DE)',
                de: 'Name (DE)',
                fr: 'Nom (DE)',
              },
              access: {
                read: hasFieldPermission('orders', 'order_details.name_de', 'read'),
                update: hasFieldPermission('orders', 'order_details.name_de', 'update'),
              },
            },
            {
              name: 'name_fr',
              type: 'text',
              label: {
                en: 'Name (FR)',
                nl: 'Naam (FR)',
                de: 'Name (FR)',
                fr: 'Nom (FR)',
              },
              access: {
                read: hasFieldPermission('orders', 'order_details.name_fr', 'read'),
                update: hasFieldPermission('orders', 'order_details.name_fr', 'update'),
              },
            },
            {
              name: 'subproducts',
              type: 'array',
              label: {
                en: 'Subproducts',
                nl: 'Subproducten',
                de: 'Unterprodukte',
                fr: 'Sous-produits',
              },
              fields: [
                {
                  name: 'subproductId',
                  type: 'text',
                  label: {
                    en: 'Subproduct ID',
                    nl: 'Subproduct ID',
                    de: 'Unterprodukt-ID',
                    fr: 'ID du Sous-produit',
                  },
                  access: {
                    read: hasFieldPermission('orders', 'order_details.subproducts.subproductId', 'read'),
                    update: hasFieldPermission('orders', 'order_details.subproducts.subproductId', 'update'),
                  },
                },
                {
                  name: 'name_nl',
                  type: 'text',
                  label: {
                    en: 'Name (NL)',
                    nl: 'Naam (NL)',
                    de: 'Name (NL)',
                    fr: 'Nom (NL)',
                  },
                  access: {
                    read: hasFieldPermission('orders', 'order_details.subproducts.name_nl', 'read'),
                    update: hasFieldPermission('orders', 'order_details.subproducts.name_nl', 'update'),
                  },
                },
                {
                  name: 'name_en',
                  type: 'text',
                  label: {
                    en: 'Name (EN)',
                    nl: 'Naam (EN)',
                    de: 'Name (EN)',
                    fr: 'Nom (EN)',
                  },
                  access: {
                    read: hasFieldPermission('orders', 'order_details.subproducts.name_en', 'read'),
                    update: hasFieldPermission('orders', 'order_details.subproducts.name_en', 'update'),
                  },
                },
                {
                  name: 'name_de',
                  type: 'text',
                  label: {
                    en: 'Name (DE)',
                    nl: 'Naam (DE)',
                    de: 'Name (DE)',
                    fr: 'Nom (DE)',
                  },
                  access: {
                    read: hasFieldPermission('orders', 'order_details.subproducts.name_de', 'read'),
                    update: hasFieldPermission('orders', 'order_details.subproducts.name_de', 'update'),
                  },
                },
                {
                  name: 'name_fr',
                  type: 'text',
                  label: {
                    en: 'Name (FR)',
                    nl: 'Naam (FR)',
                    de: 'Name (FR)',
                    fr: 'Nom (FR)',
                  },
                  access: {
                    read: hasFieldPermission('orders', 'order_details.subproducts.name_fr', 'read'),
                    update: hasFieldPermission('orders', 'order_details.subproducts.name_fr', 'update'),
                  },
                },
                {
                  name: 'price',
                  type: 'number',
                  label: {
                    en: 'Subproduct Price',
                    nl: 'Subproduct Prijs',
                    de: 'Unterproduktpreis',
                    fr: 'Prix du Sous-produit',
                  },
                  access: {
                    read: hasFieldPermission('orders', 'order_details.subproducts.price', 'read'),
                    update: hasFieldPermission('orders', 'order_details.subproducts.price', 'update'),
                  },
                },
                {
                  name: 'tax',
                  type: 'number',
                  label: {
                    en: 'Tax Rate (%)',
                    nl: 'Btw (%)',
                    de: 'MwSt (%)',
                    fr: 'TVA (%)',
                  },
                  access: {
                    read: hasFieldPermission('orders', 'order_details.subproducts.tax', 'read'),
                    update: hasFieldPermission('orders', 'order_details.subproducts.tax', 'update'),
                  },
                },
                {
                  name: 'tax_dinein',
                  type: 'number',
                  label: {
                    en: 'Dine-In Tax Rate (%)',
                    nl: 'Btw voor Eten Ter Plaatse (%)',
                    de: 'Vor-Ort MwSt (%)',
                    fr: 'TVA Sur Place (%)',
                  },
                  access: {
                    read: hasFieldPermission('orders', 'order_details.subproducts.tax_dinein', 'read'),
                    update: hasFieldPermission('orders', 'order_details.subproducts.tax_dinein', 'update'),
                  },
                },
                {
                  name: 'quantity',
                  type: 'number',
                  required: false,
                  label: {
                    en: 'Quantity',
                    nl: 'Aantal',
                    de: 'Menge',
                    fr: 'Quantité',
                  },
                  admin: {
                    description: 'If subproduct can have multiple units.',
                  },
                  access: {
                    read: hasFieldPermission('orders', 'order_details.subproducts.quantity', 'read'),
                    update: hasFieldPermission('orders', 'order_details.subproducts.quantity', 'update'),
                  },
                },
              ],
              access: {
                read: hasFieldPermission('orders', 'order_details.subproducts', 'read'),
                update: hasFieldPermission('orders', 'order_details.subproducts', 'update'),
              },
            },
          ],
          access: {
            read: hasFieldPermission('orders', 'order_details', 'read'),
            update: hasFieldPermission('orders', 'order_details', 'update'),
          },
        },
      ],
    },

    // payments array
    {
      type: 'collapsible',
      label: {
        en: 'Payment Info',
        nl: 'Betaalinfo',
        de: 'Zahlungsinfo',
        fr: 'Infos de Paiement',
      },
      admin: {
        initCollapsed: true, // or false, as you wish
      },
      fields: [
        {
          name: 'payments',
          type: 'array',
          label: {
            en: 'Payments',
            nl: 'Betalingen',
            de: 'Zahlungen',
            fr: 'Paiements',
          },
          admin: {
            description: {
              en: 'Payment details for the order.',
              nl: 'Betalingsgegevens voor de bestelling.',
              de: 'Zahlungsdetails für die Bestellung.',
              fr: 'Détails de paiement pour la commande.',
            },
          },
          fields: [
            {
              name: 'payment_method',
              type: 'relationship',
              relationTo: 'payment-methods',
              required: true,
              label: {
                en: 'Payment Method',
                nl: 'Betaalmethode',
                de: 'Zahlungsmethode',
                fr: 'Méthode de Paiement',
              },
              access: {
                read: hasFieldPermission('orders', 'payments.payment_method', 'read'),
                update: hasFieldPermission('orders', 'payments.payment_method', 'update'),
              },
            },
            {
              name: 'sub_method_label',
              type: 'text',
              required: false,
              label: {
                en: 'Sub-method Label (e.g. MSP_Bancontact)',
                nl: 'Submethode Label (bijv. MSP_Bancontact)',
                de: 'Untermethode Bezeichnung (z.B. MSP_Bancontact)',
                fr: 'Libellé de Sous-méthode (ex. MSP_Bancontact)',
              },
              access: {
                read: hasFieldPermission('orders', 'payments.sub_method_label', 'read'),
                update: hasFieldPermission('orders', 'payments.sub_method_label', 'update'),
              },
            },
            {
              name: 'amount',
              type: 'number',
              required: false,
              label: {
                en: 'Payment Amount',
                nl: 'Betaalbedrag',
                de: 'Zahlungsbetrag',
                fr: 'Montant du Paiement',
              },
              access: {
                read: hasFieldPermission('orders', 'payments.amount', 'read'),
                update: hasFieldPermission('orders', 'payments.amount', 'update'),
              },
            },
          ],
          access: {
            read: hasFieldPermission('orders', 'payments', 'read'),
            update: hasFieldPermission('orders', 'payments', 'update'),
          },
        },
        // Promotions used
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
              admin: { description: { en: 'How many membership points were redeemed?' } },
              access: {
                read: hasFieldPermission('orders', 'promotionsUsed.pointsUsed', 'read'),
                update: hasFieldPermission('orders', 'promotionsUsed.pointsUsed', 'update'),
              },
            },
            {
              name: 'creditsUsed',
              type: 'number',
              defaultValue: 0,
              label: { en: 'Store Credits Used' },
              admin: { description: { en: 'How many store credits were used?' } },
              access: {
                read: hasFieldPermission('orders', 'promotionsUsed.creditsUsed', 'read'),
                update: hasFieldPermission('orders', 'promotionsUsed.creditsUsed', 'update'),
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
                { name: 'value_type', type: 'text' },
                { name: 'valid_from', type: 'date' },
                { name: 'valid_until', type: 'date' },
                { name: 'max_uses', type: 'number' },
                { name: 'used', type: 'checkbox' },
              ],
              access: {
                read: hasFieldPermission('orders', 'promotionsUsed.couponUsed', 'read'),
                update: hasFieldPermission('orders', 'promotionsUsed.couponUsed', 'update'),
              },
            },
            {
              name: 'giftVoucherUsed',
              type: 'group',
              label: { en: 'Gift Voucher Used' },
              fields: [
                { name: 'voucherId', type: 'text' },
                { name: 'barcode', type: 'text' },
                { name: 'value', type: 'number' },
                { name: 'valid_from', type: 'date' },
                { name: 'valid_until', type: 'date' },
                { name: 'used', type: 'checkbox' },
              ],
              access: {
                read: hasFieldPermission('orders', 'promotionsUsed.giftVoucherUsed', 'read'),
                update: hasFieldPermission('orders', 'promotionsUsed.giftVoucherUsed', 'update'),
              },
            },
          ],
          access: {
            read: hasFieldPermission('orders', 'promotionsUsed', 'read'),
            update: hasFieldPermission('orders', 'promotionsUsed', 'update'),
          },
        },

        // tippingUsed
        {
          name: 'tippingUsed',
          type: 'group',
          label: { en: 'Tipping' },
          fields: [
            {
              name: 'type',
              type: 'select',
              label: { en: 'Tip Type' },
              required: false,
              defaultValue: 'none',
              options: [
                { label: 'None', value: 'none' },
                { label: 'Fixed', value: 'fixed' },
                { label: 'Percentage', value: 'percentage' },
                { label: 'Round Up', value: 'round_up' },
              ],
              admin: {
                description:
                  'Specifies whether the tip is a fixed amount, a percentage, a round-up, or none.',
              },
              access: {
                read: hasFieldPermission('orders', 'tippingUsed.type', 'read'),
                update: hasFieldPermission('orders', 'tippingUsed.type', 'update'),
              },
            },
            {
              name: 'amount',
              type: 'number',
              defaultValue: 0,
              label: { en: 'Tip Amount' },
              admin: {
                description: 'The numeric tip value (e.g. 2.50 for €2.50, or 10 for 10%).',
              },
              access: {
                read: hasFieldPermission('orders', 'tippingUsed.amount', 'read'),
                update: hasFieldPermission('orders', 'tippingUsed.amount', 'update'),
              },
            },
            {
              name: 'actualTip',
              type: 'number',
              label: { en: 'Actual Tip Calculated' },
              required: false,
              admin: {
                readOnly: true,
                description: 'The final computed tip after rounding, etc.',
              },
              access: {
                read: hasFieldPermission('orders', 'tippingUsed.actualTip', 'read'),
                update: hasFieldPermission('orders', 'tippingUsed.actualTip', 'update'),
              },
            },
          ],
          access: {
            read: hasFieldPermission('orders', 'tippingUsed', 'read'),
            update: hasFieldPermission('orders', 'tippingUsed', 'update'),
          },
        },
        // Totals
        {
          name: 'shipping_cost',
          type: 'number',
          label: { en: 'Shipping Cost' },
          required: false,
          admin: {
            description: { en: 'Delivery fee if applicable.' },
            readOnly: false,
          },
          access: {
            read: hasFieldPermission('orders', 'shipping_cost', 'read'),
            update: hasFieldPermission('orders', 'shipping_cost', 'update'),
          },
        },
        {
          name: 'subtotalBeforeDiscount',
          type: 'number',
          label: { en: 'Subtotal Before Discount' },
          admin: { readOnly: true },
          access: {
            read: hasFieldPermission('orders', 'subtotalBeforeDiscount', 'read'),
            update: hasFieldPermission('orders', 'subtotalBeforeDiscount', 'update'),
          },
        },
        {
          name: 'discountTotal',
          type: 'number',
          label: { en: 'Discount Total' },
          admin: { readOnly: true },
          access: {
            read: hasFieldPermission('orders', 'discountTotal', 'read'),
            update: hasFieldPermission('orders', 'discountTotal', 'update'),
          },
        },
        {
          name: 'totalAfterDiscount',
          type: 'number',
          label: { en: 'Total After Discount (Net)' },
          admin: { readOnly: true },
          access: {
            read: hasFieldPermission('orders', 'totalAfterDiscount', 'read'),
            update: hasFieldPermission('orders', 'totalAfterDiscount', 'update'),
          },
        },
        {
          name: 'total_tax',
          type: 'number',
          label: { en: 'Total Tax' },
          admin: { readOnly: true },
          access: {
            read: hasFieldPermission('orders', 'total_tax', 'read'),
            update: hasFieldPermission('orders', 'total_tax', 'update'),
          },
        },
        {
          name: 'subtotal',
          type: 'number',
          label: { en: 'Subtotal (Legacy)' },
          admin: {
            description: { en: 'Same as net subtotal, for backward compatibility.' },
            readOnly: true,
          },
          access: {
            read: hasFieldPermission('orders', 'subtotal', 'read'),
            update: hasFieldPermission('orders', 'subtotal', 'update'),
          },
        },
        {
          name: 'total',
          type: 'number',
          label: { en: 'Final Total' },
          admin: { readOnly: true },
          access: {
            read: hasFieldPermission('orders', 'total', 'read'),
            update: hasFieldPermission('orders', 'total', 'update'),
          },
        },
      ],
    },

    // fulfillment info
    {
      type: 'collapsible',
      label: {
        en: 'Fulfillment Info',
        nl: 'Afhandelingsinfo',
        de: 'Abwicklungsinfo',
        fr: 'Infos de Réalisation',
      },
      admin: {
        initCollapsed: true, // or false, as desired
      },
      fields: [
        {
          name: 'fulfillment_method',
          type: 'select',
          options: [
            { label: 'Delivery', value: 'delivery' },
            { label: 'Takeaway', value: 'takeaway' },
            { label: 'Dine In', value: 'dine_in' },
          ],
          label: {
            en: 'Fulfillment Method',
            nl: 'Afhandelingsmethode',
            de: 'Abwicklungsart',
            fr: 'Méthode de Réalisation',
          },
          access: {
            read: hasFieldPermission('orders', 'fulfillment_method', 'read'),
            update: hasFieldPermission('orders', 'fulfillment_method', 'update'),
          },
        },
        {
          name: 'fulfillment_date',
          type: 'text',
          label: {
            en: 'Fulfillment Date',
            nl: 'Afhandelingsdatum',
            de: 'Abwicklungsdatum',
            fr: 'Date de Réalisation',
          },
          access: {
            read: hasFieldPermission('orders', 'fulfillment_date', 'read'),
            update: hasFieldPermission('orders', 'fulfillment_date', 'update'),
          },
        },
        {
          name: 'fulfillment_time',
          type: 'text',
          label: {
            en: 'Fulfillment Time',
            nl: 'Afhandelingstijd',
            de: 'Abwicklungszeit',
            fr: 'Heure de Réalisation',
          },
          access: {
            read: hasFieldPermission('orders', 'fulfillment_time', 'read'),
            update: hasFieldPermission('orders', 'fulfillment_time', 'update'),
          },
        },
      ],
    },

    // customer info
    {
      type: 'collapsible',
      label: {
        en: 'Customer Info',
        nl: 'Klanteninfo',
        de: 'Kundeninfo',
        fr: 'Infos Client',
      },
      admin: {
        initCollapsed: true, // or false, based on your preference
      },
      fields: [
        {
          name: 'customer',
          type: 'relationship',
          relationTo: 'customers',
          required: false,
          label: {
            en: 'Customer',
            nl: 'Klant',
            de: 'Kunde',
            fr: 'Client',
          },
          admin: {
            description: {
              en: 'Link to the customer who placed this order (if known).',
              nl: 'Verwijs naar de klant die deze bestelling plaatste (indien bekend).',
              de: 'Verknüpfung zum Kunden, der diese Bestellung aufgegeben hat (falls bekannt).',
              fr: 'Lien vers le client ayant passé cette commande (si connu).',
            },
          },
          access: {
            read: hasFieldPermission('orders', 'customer', 'read'),
            update: hasFieldPermission('orders', 'customer', 'update'),
          },
        },
        {
          name: 'customerBarcode',
          type: 'text',
          required: false,
          label: {
            en: 'Customer Barcode',
            nl: 'Klant Barcode',
            de: 'Kundenbarcode',
            fr: 'Code-barres Client',
          },
          admin: {
            description: {
              en: 'If user used a barcode, store it for reference.',
              nl: 'Als de gebruiker een barcode gebruikte, sla deze hier op ter referentie.',
              de: 'Wenn der Benutzer einen Barcode verwendete, speichern Sie ihn zur Referenz.',
              fr: 'Si l’utilisateur a utilisé un code-barres, stockez-le pour référence.',
            },
          },
          access: {
            read: hasFieldPermission('orders', 'customerBarcode', 'read'),
            update: hasFieldPermission('orders', 'customerBarcode', 'update'),
          },
        },
        {
          name: 'customer_details',
          type: 'group',
          label: {
            en: 'Customer Details',
            nl: 'Klantgegevens',
            de: 'Kundendetails',
            fr: 'Détails du Client',
          },
          fields: [
            {
              name: 'firstName',
              type: 'text',
              label: {
                en: 'First Name',
                nl: 'Voornaam',
                de: 'Vorname',
                fr: 'Prénom',
              },
              access: {
                read: hasFieldPermission('orders', 'customer_details.firstName', 'read'),
                update: hasFieldPermission('orders', 'customer_details.firstName', 'update'),
              },
            },
            {
              name: 'lastName',
              type: 'text',
              label: {
                en: 'Last Name',
                nl: 'Achternaam',
                de: 'Nachname',
                fr: 'Nom',
              },
              access: {
                read: hasFieldPermission('orders', 'customer_details.lastName', 'read'),
                update: hasFieldPermission('orders', 'customer_details.lastName', 'update'),
              },
            },
            {
              name: 'email',
              type: 'text',
              label: {
                en: 'Email',
                nl: 'E-mail',
                de: 'E-Mail',
                fr: 'E-mail',
              },
              access: {
                read: hasFieldPermission('orders', 'customer_details.email', 'read'),
                update: hasFieldPermission('orders', 'customer_details.email', 'update'),
              },
            },
            {
              name: 'phone',
              type: 'text',
              label: {
                en: 'Phone',
                nl: 'Telefoon',
                de: 'Telefon',
                fr: 'Téléphone',
              },
              access: {
                read: hasFieldPermission('orders', 'customer_details.phone', 'read'),
                update: hasFieldPermission('orders', 'customer_details.phone', 'update'),
              },
            },
            {
              name: 'address',
              type: 'text',
              label: {
                en: 'Address',
                nl: 'Adres',
                de: 'Adresse',
                fr: 'Adresse',
              },
              access: {
                read: hasFieldPermission('orders', 'customer_details.address', 'read'),
                update: hasFieldPermission('orders', 'customer_details.address', 'update'),
              },
            },
            {
              name: 'city',
              type: 'text',
              label: {
                en: 'City',
                nl: 'Stad',
                de: 'Stadt',
                fr: 'Ville',
              },
              access: {
                read: hasFieldPermission('orders', 'customer_details.city', 'read'),
                update: hasFieldPermission('orders', 'customer_details.city', 'update'),
              },
            },
            {
              name: 'postalCode',
              type: 'text',
              label: {
                en: 'Postal Code',
                nl: 'Postcode',
                de: 'Postleitzahl',
                fr: 'Code Postal',
              },
              access: {
                read: hasFieldPermission('orders', 'customer_details.postalCode', 'read'),
                update: hasFieldPermission('orders', 'customer_details.postalCode', 'update'),
              },
            },
          ],
          access: {
            read: hasFieldPermission('orders', 'customer_details', 'read'),
            update: hasFieldPermission('orders', 'customer_details', 'update'),
          },
        },
      ],
    },

    // Tenant Field
    {
      ...tenantField,
      // Optionally give it a label if you like:
      // label: {
      //   en: 'Tenant',
      //   nl: 'Tenant',
      //   de: 'Mandant',
      //   fr: 'Locataire',
      // },
    },

    // metadata info
    {
      type: 'collapsible',
      label: {
        en: 'Metadata',
        nl: 'Metadata',
        de: 'Metadaten',
        fr: 'Métadonnées',
      },
      admin: {
        initCollapsed: true, // or false, your choice
      },
      fields: [


        // CloudPOS ID
        {
          name: 'cloudPOSId',
          type: 'number',
          label: {
            en: 'CloudPOS Order ID',
            nl: 'CloudPOS Order-ID',
            de: 'CloudPOS-Bestell-ID',
            fr: 'ID de Commande CloudPOS',
          },
          required: false,
          admin: {
            description: {
              en: 'The order ID used by CloudPOS if synced.',
              nl: 'Het order-ID dat door CloudPOS wordt gebruikt indien gesynchroniseerd.',
              de: 'Die Bestell-ID, die bei einer Synchronisierung von CloudPOS verwendet wird.',
              fr: 'L’ID de commande utilisé par CloudPOS en cas de synchronisation.',
            },
          },
          access: {
            read: hasFieldPermission('orders', 'cloudPOSId', 'read'),
            update: hasFieldPermission('orders', 'cloudPOSId', 'update'),
          },
        },

        // Provider Order ID
        {
          name: 'providerOrderId',
          type: 'text',
          label: {
            en: 'Payment Provider Order ID',
            nl: 'Betaalprovider Order-ID',
            de: 'Zahlungsanbieter-Bestell-ID',
            fr: 'ID de Commande du Fournisseur de Paiement',
          },
          required: false,
          admin: {
            description: {
              en: 'Order ID from e.g. MultiSafePay, Mollie, etc.',
              nl: 'Order-ID van bijv. MultiSafePay, Mollie, enz.',
              de: 'Bestell-ID z.B. von MultiSafePay, Mollie usw.',
              fr: 'ID de commande, par ex. MultiSafePay, Mollie, etc.',
            },
            readOnly: true,
          },
          access: {
            read: hasFieldPermission('orders', 'providerOrderId', 'read'),
            update: hasFieldPermission('orders', 'providerOrderId', 'update'),
          },
        },

        // User Locale
        {
          name: 'userLocale',
          type: 'text',
          label: {
            en: 'User Locale',
            nl: 'Gebruikerstaal',
            de: 'Benutzersprache',
            fr: 'Langue Utilisateur',
          },
          required: false,
          admin: {
            description: {
              en: 'User’s chosen language locale (e.g. nl, fr, en). Defaults to nl.',
              nl: 'Door gebruiker gekozen taal (bijv. nl, fr, en). Standaard nl.',
              de: 'Vom Benutzer gewählte Sprache (z.B. nl, fr, en). Standardmäßig nl.',
              fr: 'Langue choisie par l’utilisateur (ex. nl, fr, en). Par défaut nl.',
            },
          },
          access: {
            read: hasFieldPermission('orders', 'userLocale', 'read'),
            update: hasFieldPermission('orders', 'userLocale', 'update'),
          },
        },

        // Kiosk Number
        {
          name: 'kioskNumber',
          type: 'number',
          label: {
            en: 'Kiosk Number',
            nl: 'Kiosknummer',
            de: 'Kiosk-Nummer',
            fr: 'Numéro de Kiosque',
          },
          admin: {
            description: {
              en: 'If the order was placed from a kiosk, store the kiosk ID here.',
              nl: 'Als de bestelling via een kiosk is geplaatst, sla hier het kiosk-ID op.',
              de: 'Wenn die Bestellung von einem Kiosk aufgegeben wurde, speichern Sie hier die Kiosk-ID.',
              fr: 'Si la commande provient d’un kiosque, stockez l’ID du kiosque ici.',
            },
          },
          access: {
            read: hasFieldPermission('orders', 'kioskNumber', 'read'),
            update: hasFieldPermission('orders', 'kioskNumber', 'update'),
          },
        },
      ],
    },

    // (B) shopsField
    {
      ...shopsField,

    },

  ],
};

export default Orders;
