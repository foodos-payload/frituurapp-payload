import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniqueCustomerCredit: FieldHook = async ({ data, req, value, originalDoc }) => {
  const tenantID = data?.tenant || originalDoc?.tenant;
  const customerID = data?.customerid || originalDoc?.customerid;

  if (!tenantID || !customerID) {
    throw new ValidationError({
      errors:
        [
          {
            message: 'Tenant and Customer must be defined to create or update customer credit.',
            path: 'customerid',
          },
        ]
    });
  }

  const existingCredits = await req.payload.find({
    collection: 'customer-credits',
    where: {
      tenant: { equals: tenantID },
      customerid: { equals: customerID },
    },
  });

  const isDuplicate = existingCredits.docs.some((credit) => credit.id !== originalDoc?.id);

  if (isDuplicate) {
    throw new ValidationError({
      errors: [
        {
          message: `A credit entry already exists for this customer under the same tenant.`,
          path: 'customerid',
        },
      ]
    });
  }

  return value;
};
