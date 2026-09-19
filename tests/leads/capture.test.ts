import { describe, expect, it } from 'vitest';
import { validateLeadInput } from '@/modules/leads';

describe('lead capture', () => {
  it('accepts required BERN MKT lead fields', () => {
    expect(
      validateLeadInput({
        name: 'Guedes',
        whatsapp: '11988030668',
        segment: 'Corretores',
        message: 'Quero demonstracao',
      }).success,
    ).toBe(true);
  });
});
