import { canAccess, type Role, type ModuleName } from '@/lib/access';
export const AREAS = ['COMERCIAL', 'MARKETING', 'DESENVOLVIMENTO'] as const;
export type TaskArea = typeof AREAS[number];
export const AREA_LABELS: Record<TaskArea, string> = { COMERCIAL:'Comercial', MARKETING:'Marketing', DESENVOLVIMENTO:'Desenvolvimento' };
const STATUSES: Record<TaskArea, string[]> = {
  COMERCIAL: ['A_FAZER', 'EM_ANDAMENTO', 'REVISAO', 'CONCLUIDO'],
  MARKETING: ['IDEIA', 'A_FAZER', 'EM_ANDAMENTO', 'REVISAO', 'CONCLUIDO'],
  DESENVOLVIMENTO: ['BUG', 'A_FAZER', 'EM_DESENVOLVIMENTO', 'TESTE', 'FINALIZADO'],
};
export const STATUS_LABELS: Record<string, string> = {IDEIA:'Ideia',BUG:'Bug',A_FAZER:'A fazer',EM_ANDAMENTO:'Em andamento',EM_DESENVOLVIMENTO:'Em desenvolvimento',REVISAO:'Em revisão',TESTE:'Em teste',CONCLUIDO:'Concluído',FINALIZADO:'Finalizado'};
export function getStatusesForArea(area: TaskArea): string[] { return STATUSES[area]; }
export function moduleForArea(area: TaskArea): ModuleName { return area.toLowerCase() as ModuleName; }
export function visibleAreas(user: { role: Role; roles?: Role[] }): TaskArea[] { return AREAS.filter(a => canAccess(user.roles ?? user.role, moduleForArea(a))); }
export function isDone(status: string): boolean { return status === 'CONCLUIDO' || status === 'FINALIZADO'; }
export type TaskRow = {
 id:number; area:TaskArea; title:string; description:string; kind:'INTERNA'|'SOLICITACAO';
 status:string; priority:string; due_date:string|null; responsible_user_id:number|null;
 responsible_name?:string|null; created_by_user_id:number|null; creator_name:string;
 progress:number; completed_at:string|null; created_at:string; updated_at:string; version:number;
};
export async function listMembers(db: D1Database, area: TaskArea) {
  return (await db.prepare(`SELECT DISTINCT u.id, u.name FROM users u LEFT JOIN user_roles r ON r.user_id=u.id
    WHERE u.status='ATIVO' AND (r.role IN ('OWNER', ?) OR (NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id=u.id) AND u.role IN ('OWNER', ?))) ORDER BY u.name`)
    .bind('ADMIN_'+area,'ADMIN_'+area).all<{id:number;name:string}>()).results;
}
