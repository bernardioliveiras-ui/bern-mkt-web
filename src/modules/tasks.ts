export type TaskArea = 'MARKETING' | 'DESENVOLVIMENTO';

const STATUSES: Record<TaskArea, string[]> = {
  MARKETING: ['IDEIA', 'A_FAZER', 'EM_ANDAMENTO', 'REVISAO', 'CONCLUIDO'],
  DESENVOLVIMENTO: ['BUG', 'A_FAZER', 'EM_DESENVOLVIMENTO', 'TESTE', 'FINALIZADO'],
};

export function getStatusesForArea(area: TaskArea): string[] {
  return STATUSES[area];
}
