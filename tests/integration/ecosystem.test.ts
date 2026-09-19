import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync } from 'node:fs';
import { beforeEach, afterEach, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import worker from '@/worker';

let sqlite: DatabaseSync;
let db: D1Database;
let cookies: Record<string, string>;
const passwordHash = bcrypt.hashSync('Teste@2026-segura', 4);
function statement(sql: string, values: any[] = []): D1PreparedStatement {
  return {
    bind: (...args: any[]) => statement(sql, args),
    first: async () => (sqlite.prepare(sql).get(...values) ?? null) as any,
    all: async () => ({ results: sqlite.prepare(sql).all(...values) as any }),
    run: async () => { const r = sqlite.prepare(sql).run(...values); return { success: true, meta: { last_row_id: Number(r.lastInsertRowid), changes: Number(r.changes) } }; },
  };
}
async function req(path: string, who = 'owner', data?: Record<string, string | string[]>) {
  const headers: Record<string, string> = { Cookie: cookies[who] || '', Origin: 'https://bern.test' };
  let body;
  if (data) { body = new URLSearchParams(); for (const [k, v] of Object.entries(data)) for (const item of Array.isArray(v) ? v : [v]) body.append(k, item); }
  return worker.fetch(new Request(`https://bern.test${path}`, { method: data ? 'POST' : 'GET', headers, body }), { DB: db });
}
beforeEach(async () => {
  sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  sqlite.exec(readFileSync('migrations/0001_initial.sql', 'utf8'));
  if (existsSync('migrations/0002_ecossistema.sql')) sqlite.exec(readFileSync('migrations/0002_ecossistema.sql', 'utf8'));
  db = { prepare: (sql: string) => statement(sql), batch: async (items: D1PreparedStatement[]) => {
    sqlite.exec('BEGIN');
    try { const results = []; for (const s of items) results.push(await s.run()); sqlite.exec('COMMIT'); return results; }
    catch (e) { sqlite.exec('ROLLBACK'); throw e; }
  }} as D1Database;
  cookies = {};
  for (const [name, role] of [['owner','OWNER'],['marketing','ADMIN_MARKETING'],['dev','ADMIN_DESENVOLVIMENTO'],['commercial','ADMIN_COMERCIAL']]) {
    sqlite.prepare('INSERT INTO users (name,username,password_hash,role,must_change_password) VALUES (?,?,?,?,0)').run(name,name,passwordHash,role);
    const res = await req('/api/auth/login', '', { username:name, password:'Teste@2026-segura' });
    cookies[name] = res.headers.get('set-cookie')!.split(';')[0];
  }
});
afterEach(() => sqlite.close());
it('blocks cross-sector task creation on the server', async () => {
  const r = await req('/api/tasks', 'marketing', { area:'DESENVOLVIMENTO', kind:'INTERNA', title:'Invadir outro setor' });
  expect(r.status).toBe(403);
  expect(sqlite.prepare('SELECT COUNT(*) AS n FROM tasks').get()!.n).toBe(0);
});
it('only owner sends requests; sector can create internal work', async () => {
  expect((await req('/api/tasks','marketing',{area:'MARKETING',kind:'SOLICITACAO',title:'Não permitido'})).status).toBe(403);
  expect((await req('/api/tasks','marketing',{area:'MARKETING',kind:'INTERNA',title:'Organizar calendário'})).status).toBe(302);
  expect((await req('/api/tasks','owner',{area:'MARKETING',kind:'SOLICITACAO',title:'Produzir VSL',priority:'ALTA'})).status).toBe(302);
});
it('owner edits multiple roles without resetting password and sector sees both menus', async () => {
  const id = sqlite.prepare("SELECT id FROM users WHERE username='marketing'").get()!.id;
  const r = await req(`/api/users/${id}`, 'owner', { name:'Vinicius', roles:['ADMIN_COMERCIAL','ADMIN_MARKETING'], status:'ATIVO' });
  expect(r.status).toBe(302);
  // role edit revokes previous sessions; login again
  const login = await req('/api/auth/login','', {username:'marketing',password:'Teste@2026-segura'});
  cookies.marketing = login.headers.get('set-cookie')!.split(';')[0];
  const html = await (await req('/painel','marketing')).text();
  expect(html).toContain('href="/painel/comercial"');
  expect(html).toContain('href="/painel/marketing"');
  expect(html).not.toContain('href="/painel/financeiro"');
  expect((await req('/painel/desenvolvimento','marketing')).status).toBe(403);
  expect((await req('/api/users','marketing',{name:'Hacker',username:'hacker',password:'Password123',roles:['OWNER']})).status).toBe(403);
});
it('records comments and progress, restricts final approval to owner', async () => {
  await req('/api/tasks','owner',{area:'MARKETING',kind:'SOLICITACAO',title:'VSL',priority:'ALTA'});
  const id = sqlite.prepare('SELECT id FROM tasks').get()!.id;
  expect((await req(`/api/tasks/${id}/comments`,'dev',{body:'Não autorizado'})).status).toBe(403);
  expect((await req(`/api/tasks/${id}/comments`,'marketing',{body:'Roteiro pronto <script>alert(1)</script>'})).status).toBe(302);
  expect((await req(`/api/tasks/${id}/update`,'marketing',{status:'REVISAO',progress:'90',responsible_user_id:'2'})).status).toBe(302);
  expect((await req(`/api/tasks/${id}/update`,'marketing',{status:'CONCLUIDO',progress:'100',responsible_user_id:'2'})).status).toBe(403);
  expect((await req(`/api/tasks/${id}/update`,'owner',{status:'CONCLUIDO',progress:'100',responsible_user_id:'2'})).status).toBe(302);
  const html = await (await req(`/painel/tarefas/${id}`,'owner')).text();
  expect(html).toContain('Roteiro pronto &lt;script&gt;');
  expect(html).toContain('CONCLUIDO');
  expect(Number(sqlite.prepare('SELECT COUNT(*) AS n FROM task_events').get()!.n)).toBeGreaterThan(1);
});
it('deletes users while preserving history and blocking their sessions', async () => {
  await req('/api/tasks','marketing',{area:'MARKETING',kind:'INTERNA',title:'Histórico preservado'});
  const id = sqlite.prepare("SELECT id FROM users WHERE username='marketing'").get()!.id;
  expect((await req(`/api/users/${id}/delete`,'owner',{confirm_username:'errado'})).status).toBe(400);
  expect((await req(`/api/users/${id}/delete`,'owner',{confirm_username:'marketing'})).status).toBe(302);
  expect(sqlite.prepare("SELECT id FROM users WHERE username='marketing'").get()).toBeUndefined();
  expect((await req('/painel','marketing')).status).toBe(302);
  expect(sqlite.prepare('SELECT title FROM tasks').get()!.title).toBe('Histórico preservado');
  expect(Number(sqlite.prepare('SELECT COUNT(*) AS n FROM task_events').get()!.n)).toBeGreaterThan(0);
  expect((await req('/api/users/1/delete','owner',{confirm_username:'owner'})).status).toBe(400);
});
it('rejects assignment outside destination sector and invalid progress', async () => {
  expect((await req('/api/tasks','owner',{area:'MARKETING',kind:'SOLICITACAO',title:'VSL',responsible_user_id:'3'})).status).toBe(400);
  await req('/api/tasks','marketing',{area:'MARKETING',kind:'INTERNA',title:'VSL'});
  expect((await req('/api/tasks/1/update','marketing',{status:'REVISAO',progress:'120'})).status).toBe(400);
});
it('does not expose other-sector tasks or metrics and rejects cross-origin writes', async () => {
  await req('/api/tasks','owner',{area:'DESENVOLVIMENTO',kind:'SOLICITACAO',title:'SEGREDO-DEV'});
  expect(await (await req('/painel','marketing')).text()).not.toContain('SEGREDO-DEV');
  expect((await req('/painel/tarefas/1','marketing')).status).toBe(403);
  const r = await worker.fetch(new Request('https://bern.test/api/tasks', {method:'POST',headers:{Origin:'https://evil.test',Cookie:cookies.owner},body:new URLSearchParams({area:'MARKETING',title:'Ataque'})}),{DB:db});
  expect(r.status).toBe(403);
});
it('creates user through panel and enforces first password change', async () => {
  expect((await req('/api/users','owner',{name:'Novo',username:'novo',password:'Primeira@123',roles:['ADMIN_MARKETING']})).status).toBe(302);
  const login = await req('/api/auth/login','',{username:'novo',password:'Primeira@123'});
  expect(login.headers.get('location')).toBe('/painel/senha');
  cookies.novo = login.headers.get('set-cookie')!.split(';')[0];
  expect((await req('/painel','novo')).headers.get('location')).toBe('/painel/senha');
  expect((await req('/api/auth/password','novo',{current_password:'Primeira@123',password:'Segunda@456',confirmation:'Segunda@456'})).status).toBe(302);
  expect(sqlite.prepare("SELECT must_change_password FROM users WHERE username='novo'").get()!.must_change_password).toBe(0);
});
it('commercial follows a captured lead through assignment, return and history', async () => {
  expect((await req('/api/public/leads','',{name:'Cliente real',whatsapp:'11988887777',segment:'Corretores',message:'Quero testar'})).status).toBe(200);
  expect((await req('/painel/leads/1','marketing')).status).toBe(403);
  expect((await req('/api/leads/1','commercial',{status:'DEMO_MARCADA',assigned_to_user_id:'4',demo_at:'2026-10-10T14:30',next_contact_at:'2026-10-09T10:00',notes:'Demo confirmada',loss_reason:''})).status).toBe(302);
  const row = sqlite.prepare('SELECT * FROM leads WHERE id=1').get()!;
  expect(row.status).toBe('DEMO_MARCADA');
  expect(row.assigned_to_user_id).toBe(4);
  expect(row.demo_at).toContain('14:30');
  expect(Number(sqlite.prepare('SELECT COUNT(*) AS n FROM lead_events').get()!.n)).toBe(1);
  const html = await (await req('/painel/leads/1','commercial')).text();
  expect(html).toContain('https://wa.me/5511988887777');
  expect(html).toContain('Quero testar');
  expect(html).toContain('Demo confirmada');
  expect((await req('/api/leads/1','commercial',{status:'PERDIDO',loss_reason:''})).status).toBe(400);
});
it('renders every owner screen and keeps management controls out of sector pages',async()=>{
 await req('/api/tasks','owner',{area:'MARKETING',kind:'SOLICITACAO',title:'Entrega de teste'});
 for(const path of ['/painel','/painel/usuarios','/painel/marketing','/painel/desenvolvimento','/painel/tarefas/comercial','/painel/tarefas/1','/painel/comercial','/painel/financeiro']){
  const response=await req(path);expect(response.status,path).toBe(200);expect(await response.text()).toContain('<!doctype html>');
 }
 const html=await (await req('/painel/marketing','marketing')).text();
 expect(html).toContain('Criar tarefa interna');expect(html).not.toContain('<option value="SOLICITACAO">');
});
it('rejects stale edits without adding a misleading history entry',async()=>{
 await req('/api/tasks','marketing',{area:'MARKETING',kind:'INTERNA',title:'Edição concorrente'});
 expect((await req('/api/tasks/1/update','marketing',{status:'EM_ANDAMENTO',progress:'30',version:'0'})).status).toBe(302);
 expect((await req('/api/tasks/1/update','marketing',{status:'REVISAO',progress:'90',version:'0'})).status).toBe(409);
 expect(sqlite.prepare('SELECT progress FROM tasks').get()!.progress).toBe(30);
 expect(sqlite.prepare('SELECT COUNT(*) n FROM task_events').get()!.n).toBe(2);
});
