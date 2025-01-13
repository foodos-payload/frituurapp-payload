import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateOrder } from './access/byTenant';
import { readAccess } from './access/readAccess';
import { generateOrderSummaryEmail } from '../../email/generateOrderSummaryEmail'


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
        if (operation !== 'create') {
          return;
        }

        if (!data.userLocale) {
          data.userLocale = 'nl';
        }

        // 1) If kiosk => override the fulfillment_time & sub_method_label
        if (data.order_type === 'kiosk') {
          const now = new Date();
          data.fulfillment_time = now.toTimeString().slice(0, 5);
          if (data.payments && data.payments.length > 0) {
            data.payments[0].sub_method_label = 'terminal';
          }
        }

        // 2) Timeslot concurrency check => ensure date/time not fully booked
        const methodType = data.fulfillment_method;         // e.g. 'delivery'
        const dateStr = data.fulfillment_date;              // e.g. '2025-01-10'
        const timeStr = data.fulfillment_time;              // e.g. '09:15'

        if (methodType && dateStr && timeStr) {
          // (A) Find the relevant fulfillment-method doc => check shared_booked_slots
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

          // (B) Convert dateStr => dayOfWeek => find timeslot range => get max_orders
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

          // Find timeslot doc => see if the chosen time is in a [start..end] range
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

          // (D) Count existing orders with same date/time + method(s) => exclude cancelled
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
          });

          if (usageCheck.docs.length >= matchedMaxOrders) {
            throw new Error(`Sorry, that timeslot is fully booked! Please pick another time.`);
          }
        }
        // End concurrency check

        // 3) Auto-increment: daily `tempOrdNr` + global `id`
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

        // 4) (Optional) Cross-check each line's price with official product price
        if (data.order_details) {
          for (const od of data.order_details) {
            try {
              const productDoc = await req.payload.findByID({
                collection: 'products',
                id: od.product,
              });
              if (productDoc) {
                // Compare with official product price
                const officialPrice = productDoc.price_unified
                  ? productDoc.price
                  : productDoc.price; // Simplified logic
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

            // IMPORTANT: If subproduct has its own quantity, multiply that as well:
            if (od.subproducts) {
              for (const sub of od.subproducts) {
                // If sub.quantity is defined, multiply it separately:
                const subQty = sub.quantity ?? 1; // fallback to 1 if not present
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
          const {
            pointsUsed,
            creditsUsed,
            couponUsed,
            giftVoucherUsed,
          } = data.promotionsUsed;

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

              // Store the coupon's ID
              data.promotionsUsed.couponUsed.couponId = couponDoc.id;

              // Apply discount
              if (couponUsed.value_type === 'fixed') {
                discount += couponUsed.value || 0;
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

            discount += giftVoucherUsed.value || 0;

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
    afterChange: [
      // 1) Print Logic: New vs Update
      async ({ doc, previousDoc, operation, req }) => {
        // ───────────────────────────────────────────────────
        // A) NEW order with a non-pending status
        // ───────────────────────────────────────────────────
        if (operation === 'create' && doc.status !== 'pending_payment') {
          try {
            if (doc.order_type === 'kiosk') {
              // ───────────────────────────────────────────────────
              // KIOSK LOGIC (create)
              // ───────────────────────────────────────────────────
              if (!doc.kioskNumber) {
                console.warn('Order is kiosk-type, but no kioskNumber found; skipping kiosk print.');
                return;
              }

              // 1) Gather shop IDs
              const shopIDs = Array.isArray(doc.shops)
                ? doc.shops.map((s: any) => (typeof s === 'object' ? s.id : s))
                : [doc.shops];

              if (!shopIDs.length) {
                console.warn('No shops found on this kiosk order; skipping kiosk print.');
                return;
              }

              // 2) Find kiosk printers for these shops
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

              // 3) Print only the "customer" ticket on the matching kiosk printer
              for (const p of kioskPrinters.docs) {
                try {
                  const nameParts = p.printer_name?.split('-') || [];
                  const lastPart = nameParts[nameParts.length - 1];

                  // If last part matches doc.kioskNumber => print
                  if (String(lastPart) === String(doc.kioskNumber)) {
                    await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/printOrder`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        printerName: p.printer_name,
                        ticketType: 'customer', // kiosk only prints a customer ticket
                        orderData: doc,
                      }),
                    });
                  }
                } catch (kioskErr) {
                  console.error(`Error printing kiosk ticket to printer ${p.printer_name}:`, kioskErr);
                }
              }

              // ───────────────────────────────────────────────────
            } else {
              // ───────────────────────────────────────────────────
              // KITCHEN LOGIC (create)
              // ───────────────────────────────────────────────────
              // 1) Gather shop IDs
              const shopIDs = Array.isArray(doc.shops)
                ? doc.shops.map((s: any) => (typeof s === 'object' ? s.id : s))
                : [doc.shops];

              if (!shopIDs.length) {
                console.warn('No shops found on this order; skipping kitchen print.');
                return;
              }

              // 2) Find all kitchen printers for these shops
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

              // 3) Print the "kitchen" ticket, and optionally customer
              for (const p of printers.docs) {
                try {
                  // Always print the "kitchen" ticket
                  await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/printOrder`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      printerName: p.printer_name,
                      ticketType: 'kitchen',
                      orderData: doc,
                    }),
                  });

                  // If that printer also prints a customer copy
                  if (p?.customer_enabled === true) {
                    await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/printOrder`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        printerName: p.printer_name,
                        ticketType: 'customer',
                        orderData: doc,
                      }),
                    });
                  }
                } catch (printErr) {
                  console.error(`Error printing to printer ${p.printer_name}:`, printErr);
                }
              }
            }
          } catch (err) {
            console.error('Error in order afterChange print hook (create):', err);
          }
          return; // Stop here for the create case
        }

        // ───────────────────────────────────────────────────
        // B) EXISTING order updated: from pending_payment → something else
        // ───────────────────────────────────────────────────
        if (operation === 'update') {
          const oldStatus = previousDoc?.status;
          const newStatus = doc.status;

          if (oldStatus === 'pending_payment' && newStatus !== 'pending_payment') {
            try {
              if (doc.order_type === 'kiosk') {
                // ───────────────────────────────────────────────────
                // KIOSK LOGIC (update)
                // ───────────────────────────────────────────────────
                if (!doc.kioskNumber) {
                  console.warn('Order is kiosk-type, but no kioskNumber found; skipping kiosk print.');
                  return;
                }

                // 1) Gather shop IDs
                const shopIDs = Array.isArray(doc.shops)
                  ? doc.shops.map((s: any) => (typeof s === 'object' ? s.id : s))
                  : [doc.shops];

                if (!shopIDs.length) {
                  console.warn('No shops found on this kiosk order; skipping kiosk print.');
                  return;
                }

                // 2) Find kiosk printers
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

                // 3) Print only the "customer" ticket on the matching kiosk printer
                for (const p of kioskPrinters.docs) {
                  try {
                    const nameParts = p.printer_name?.split('-') || [];
                    const lastPart = nameParts[nameParts.length - 1];
                    if (String(lastPart) === String(doc.kioskNumber)) {
                      await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/printOrder`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          printerName: p.printer_name,
                          ticketType: 'customer', // kiosk only prints a customer ticket
                          orderData: doc,
                        }),
                      });
                    }
                  } catch (kioskErr) {
                    console.error(`Error printing kiosk ticket to printer ${p.printer_name}:`, kioskErr);
                  }
                }

                // ───────────────────────────────────────────────────
              } else {
                // ───────────────────────────────────────────────────
                // KITCHEN LOGIC (update)
                // ───────────────────────────────────────────────────
                // 1) Gather shop IDs
                const shopIDs = Array.isArray(doc.shops)
                  ? doc.shops.map((s: any) => (typeof s === 'object' ? s.id : s))
                  : [doc.shops];

                if (!shopIDs.length) {
                  console.warn('No shops found on this order; skipping print logic.');
                  return;
                }

                // 2) Find all kitchen printers for these shops
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

                // 3) Print "kitchen" + optional "customer"
                for (const p of printers.docs) {
                  try {
                    // Always print the "kitchen" ticket
                    await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/printOrder`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        printerName: p.printer_name,
                        ticketType: 'kitchen',
                        orderData: doc,
                      }),
                    });

                    // If that printer also prints a customer copy
                    if (p?.customer_enabled === true) {
                      await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/printOrder`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          printerName: p.printer_name,
                          ticketType: 'customer',
                          orderData: doc,
                        }),
                      });
                    }
                  } catch (printErr) {
                    console.error(`Error printing to printer ${p.printer_name}:`, printErr);
                  }
                }
              }
            } catch (err) {
              console.error('Error in order afterChange print hook (update):', err);
            }
          }
        }
      },

      // 2) Email Logic: unchanged from your existing code
      async ({ doc, operation, req }) => {
        if (operation === 'create') {
          try {
            let branding: any = {};

            // 1) If there's at least one shop attached, use the first
            if (doc.shops && doc.shops.length > 0) {
              const firstShopId = doc.shops[0]?.id ?? doc.shops[0];
              if (firstShopId) {
                // (A) Fetch the Shop doc
                const shopDoc = await req.payload.findByID({
                  collection: 'shops',
                  id: firstShopId,
                });
                if (shopDoc) {
                  // (B) Find the ShopBranding doc referencing this shop
                  const brandingRes = await req.payload.find({
                    collection: 'shop-branding',
                    where: { shops: { in: [shopDoc.id] } },
                    depth: 2,
                    limit: 1,
                  });
                  const brandingDoc = brandingRes.docs[0] || null;

                  // Convert the returned doc into a simpler object if needed:
                  branding = {
                    siteTitle: brandingDoc?.siteTitle || shopDoc.name,
                    logoUrl: brandingDoc?.siteLogo,
                    headerBackgroundColor: brandingDoc?.headerBackgroundColor,
                    primaryColorCTA: brandingDoc?.primaryColorCTA,
                    googleReviewUrl: brandingDoc?.googleReviewUrl,
                    tripAdvisorUrl: brandingDoc?.tripAdvisorUrl,
                    // ... add other fields if desired
                  };
                }
              }
            }

            // 2) Build your "itemLines" array
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
            // <-- NEW optional "quantity" field for subproducts
            {
              name: 'quantity',
              type: 'number',
              required: false,
              label: { en: 'Quantity' },
              admin: {
                description: 'If subproduct can have multiple units.',
              },
            },
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
            { name: 'valid_from', type: 'date' },
            { name: 'valid_until', type: 'date' },
            { name: 'used', type: 'checkbox' },
          ],
        },
      ],
    },
    {
      name: 'userLocale',
      type: 'text',
      label: 'User Locale',
      required: false,
      admin: {
        description: 'The user’s chosen language locale (e.g., nl, fr, en). Defaults to nl.',
      },
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
