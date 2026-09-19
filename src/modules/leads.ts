import { z } from 'zod';

export const leadInputSchema = z.object({
  name: z.string().trim().min(2),
  whatsapp: z.string().trim().min(10),
  segment: z.string().trim().min(2),
  message: z.string().trim().optional().default(''),
});

export type LeadInput = z.infer<typeof leadInputSchema>;

export const LEAD_STATUSES = [
  'NOVO',
  'EM_CONTATO',
  'WHATSAPP_ENVIADO',
  'PDF_ENVIADO',
  'DEMO_MARCADA',
  'DEMO_FEITA',
  'PROPOSTA',
  'FECHADO',
  'PERDIDO',
  'NAO_CONTATAR',
] as const;

export function validateLeadInput(input: unknown) {
  return leadInputSchema.safeParse(input);
}

export function isLeadStatus(status: string): boolean {
  return LEAD_STATUSES.includes(status as (typeof LEAD_STATUSES)[number]);
}
