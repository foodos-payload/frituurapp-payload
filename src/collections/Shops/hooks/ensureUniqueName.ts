import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniqueName: FieldHook = async ({ data, originalDoc, req, value }) => {
  if (originalDoc?.name === value) return value;

  const tenantID = data?.tenant || originalDoc?.tenant;

  const existingShop = await req.payload.find({
    collection: 'shops',
    where: {
      and: [
        { tenant: { equals: tenantID } },
        { name: { equals: value } },
      ],
    },
  });

  if (existingShop.docs.length > 0) {
    throw new ValidationError({
      errors: [
        {
          message: `A shop with the name "${value}" already exists for this tenant.`,
          path: 'name',
        },
      ],
    });
  }

  return value;
};
