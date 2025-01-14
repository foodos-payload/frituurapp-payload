import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const validateTipOptions: FieldHook = async ({ data, value }) => {
  // Example: limit the number of tipOptions to 5
  const tipArray = Array.isArray(value) ? value : [];
  if (tipArray.length > 5) {
    throw new ValidationError({
      errors: [
        {
          message: 'You cannot have more than 5 tip options.',
          path: 'tipOptions',
        },
      ],
    });
  }

  return value;
};
