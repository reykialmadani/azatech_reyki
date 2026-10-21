import type { ValidationError } from '@nestjs/common';
import { flattenValidationErrors } from './validation.pipe.js';

describe('flattenValidationErrors', () => {
  it('meratakan error bertingkat menjadi kunci dot-notation', () => {
    const errors: ValidationError[] = [
      { property: 'customer_id', constraints: { isUuid: 'customer_id tidak valid' } },
      {
        property: 'items',
        children: [
          {
            property: '1',
            children: [{ property: 'quantity', constraints: { min: 'Jumlah minimal 1' } }],
          },
        ],
      },
    ];

    expect(flattenValidationErrors(errors)).toEqual({
      customer_id: ['customer_id tidak valid'],
      'items.1.quantity': ['Jumlah minimal 1'],
    });
  });
});
