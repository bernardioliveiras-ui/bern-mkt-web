import { describe, expect, it } from 'vitest';
import { getStatusesForArea } from '@/modules/tasks';

describe('task board statuses', () => {
  it('uses marketing statuses', () => {
    expect(getStatusesForArea('MARKETING')).toEqual(['IDEIA', 'A_FAZER', 'EM_ANDAMENTO', 'REVISAO', 'CONCLUIDO']);
  });

  it('uses development statuses', () => {
    expect(getStatusesForArea('DESENVOLVIMENTO')).toEqual(['BUG', 'A_FAZER', 'EM_DESENVOLVIMENTO', 'TESTE', 'FINALIZADO']);
  });
});
