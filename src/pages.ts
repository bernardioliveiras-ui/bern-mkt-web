import { canAccess, type ModuleName } from '@/lib/access';
import type { SessionUser } from '@/auth';
import { getStatusesForArea, type TaskArea } from '@/modules/tasks';

type Metric = {
  label: string;
  value: string;
  hint: string;
};

type TaskRow = {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
};

type LeadRow = {
  id: number;
  name: string;
  whatsapp: string;
  segment: string;
  status: string;
  created_at: string;
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const styles = `
:root{color-scheme:dark;--bg:#09090b;--panel:#141418;--panel-2:#1d1d23;--text:#fff7ed;--muted:#b9b1a7;--red:#f0003c;--line:#31313a;--beige:#f5e8d3}
*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial,sans-serif;background:var(--bg);color:var(--text)}a{color:inherit;text-decoration:none}.shell{min-height:100vh;background:radial-gradient(circle at 30% 0,#3b0b17 0,transparent 34%),var(--bg)}.wrap{width:min(1180px,calc(100% - 32px));margin:0 auto}.top{display:flex;align-items:center;justify-content:space-between;padding:22px 0}.brand{font-weight:900;letter-spacing:.04em}.brand span{color:var(--red)}.btn{border:0;border-radius:18px;background:var(--red);color:white;font-weight:900;padding:14px 18px;display:inline-flex;gap:8px;align-items:center;cursor:pointer}.btn.secondary{background:transparent;border:1px solid var(--line);color:var(--text)}.hero{padding:56px 0 38px;display:grid;grid-template-columns:1.05fr .95fr;gap:28px;align-items:center}.eyebrow{color:var(--red);font-weight:900;letter-spacing:.16em;text-transform:uppercase;font-size:12px}.hero h1{font-size:clamp(42px,7vw,86px);line-height:.9;margin:18px 0}.hero p{font-size:20px;line-height:1.6;color:var(--muted);max-width:640px}.card{background:linear-gradient(180deg,var(--panel),#101014);border:1px solid var(--line);border-radius:28px;padding:24px;box-shadow:0 24px 80px rgba(0,0,0,.32)}.vsl{aspect-ratio:16/9;display:grid;place-items:center;text-align:center;background:linear-gradient(145deg,#201017,#09090b);border:1px dashed #65404c;border-radius:22px;color:var(--beige)}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.section{padding:34px 0}.section h2{font-size:34px;margin:0 0 16px}.input,textarea,select{width:100%;background:#0f0f13;color:var(--text);border:1px solid var(--line);border-radius:14px;padding:13px 14px;font:inherit}label{display:grid;gap:6px;color:var(--muted);font-weight:700}form{display:grid;gap:12px}.login{min-height:100vh;display:grid;place-items:center;padding:24px}.login .card{width:min(430px,100%)}.layout{display:grid;grid-template-columns:270px 1fr;min-height:100vh}.side{background:#08080a;border-right:1px solid var(--line);padding:24px;position:sticky;top:0;height:100vh}.side nav{display:grid;gap:8px;margin-top:26px}.side a{padding:13px 14px;border-radius:14px;color:var(--muted);font-weight:800}.side a.active,.side a:hover{background:var(--red);color:white}.main{padding:28px}.toolbar{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:24px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.metric strong{display:block;font-size:32px}.table{width:100%;border-collapse:collapse}.table th,.table td{text-align:left;padding:14px;border-bottom:1px solid var(--line);color:var(--muted)}.table th{color:var(--beige);font-size:12px;text-transform:uppercase;letter-spacing:.12em}.board{display:grid;grid-template-columns:repeat(5,minmax(180px,1fr));gap:12px;overflow:auto}.lane{background:#0f0f13;border:1px solid var(--line);border-radius:18px;padding:14px;min-height:280px}.task{background:var(--panel-2);border:1px solid var(--line);border-radius:14px;padding:12px;margin:10px 0}.notice{background:#201017;border:1px solid #5a1f31;border-radius:16px;padding:14px;color:#ffdce5}.mobile-nav{display:none}
@media (max-width:900px){.hero{grid-template-columns:1fr}.grid,.metrics{grid-template-columns:1fr 1fr}.layout{grid-template-columns:1fr}.side{position:relative;height:auto}.side nav{grid-template-columns:1fr 1fr}.main{padding:18px}.board{grid-template-columns:1fr}.toolbar{align-items:flex-start;flex-direction:column}}
@media (max-width:560px){.wrap{width:min(100% - 22px,1180px)}.grid,.metrics{grid-template-columns:1fr}.hero{padding-top:26px}.hero h1{font-size:44px}.top{gap:12px}.top .btn{padding:11px 13px}.side nav{grid-template-columns:1fr}}
`;

function page(title: string, body: string): Response {
  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="BERN MKT, discador inteligente para equipes comerciais venderem mais com agilidade."><style>${styles}</style></head><body>${body}</body></html>`, {
    headers: { 'content-type': 'text/html;charset=UTF-8' },
  });
}

export function renderLandingPage(url: URL): string {
  const ok = url.searchParams.get('ok') === '1';
  return `<div class="shell"><div class="wrap"><header class="top"><a class="brand" href="/">BERN <span>MKT</span></a><a class="btn secondary" href="/entrar">Acesse Portal</a></header><main class="hero"><section><div class="eyebrow">Discador inteligente para times comerciais</div><h1>Trabalhe de forma inteligente</h1><p>Organize listas, acelere a prospeccao, direcione interessados para WhatsApp e transforme volume em rotina comercial previsivel.</p><p><a class="btn" href="#demonstracao">Quero uma demonstracao</a></p></section><section class="card"><div class="vsl"><div><strong>Espaco reservado para VSL</strong><br>Coloque aqui seu video de venda quando estiver pronto.</div></div></section></main><section class="section grid"><div class="card"><h3>Google ate prova</h3><p>Pagina SEO preparada para capturar demanda de quem procura produtividade em prospeccao.</p></div><div class="card"><h3>Discador ate WhatsApp</h3><p>Fluxo pensado para ligacao, interessado, conversa e envio do material no WhatsApp.</p></div><div class="card"><h3>PDF e demonstracao</h3><p>Capte o lead e leve para uma demonstracao com controle comercial no painel.</p></div></section><section id="demonstracao" class="section"><div class="card"><h2>Solicite uma demonstracao</h2>${ok ? '<p class="notice">Recebemos seu contato. O time comercial vai chamar no WhatsApp.</p>' : ''}<form method="post" action="/api/public/leads"><label>Nome<input class="input" name="name" required minlength="2"></label><label>WhatsApp<input class="input" name="whatsapp" required minlength="10" inputmode="tel"></label><label>Segmento<select name="segment"><option>Corretores</option><option>Vendas internas</option><option>Telemarketing</option><option>Outros</option></select></label><label>Mensagem<textarea name="message" rows="4" placeholder="Conte como sua equipe prospecta hoje"></textarea></label><button class="btn" type="submit">Enviar para o comercial</button></form></div></section></div></div>`;
}

export function landingResponse(url: URL): Response {
  return page('BERN MKT - Discador Inteligente', renderLandingPage(url));
}

export function loginPage(error = false): Response {
  return page('Entrar - BERN MKT', `<main class="login"><section class="card"><a class="brand" href="/">BERN <span>MKT</span></a><h1>Acesse o portal</h1><p style="color:var(--muted)">Entre com o usuario criado pelo PowerShell.</p>${error ? '<p class="notice">Usuario ou senha invalidos.</p>' : ''}<form method="post" action="/api/auth/login"><label>Usuario<input class="input" name="username" autocomplete="username" required></label><label>Senha<input class="input" name="password" type="password" autocomplete="current-password" required></label><button class="btn" type="submit">Entrar</button></form></section></main>`);
}

function nav(user: SessionUser, active: ModuleName): string {
  const links: Array<[ModuleName, string, string]> = [
    ['dashboard', 'Visao geral', '/painel'],
    ['comercial', 'Comercial', '/painel/comercial'],
    ['marketing', 'Marketing', '/painel/marketing'],
    ['desenvolvimento', 'Desenvolvimento', '/painel/desenvolvimento'],
    ['financeiro', 'Financeiro', '/painel/financeiro'],
    ['usuarios', 'Usuarios', '/painel/usuarios'],
  ];
  return `<aside class="side"><a class="brand" href="/painel">BERN <span>MKT</span></a><p style="color:var(--muted)">Logado como<br><strong style="color:var(--text)">${escapeHtml(user.name)}</strong><br>${escapeHtml(user.role)}</p><nav>${links
    .filter(([moduleName]) => canAccess(user.role, moduleName))
    .map(([moduleName, label, href]) => `<a class="${active === moduleName ? 'active' : ''}" href="${href}">${label}</a>`)
    .join('')}<a href="/api/auth/logout">Sair</a></nav></aside>`;
}

function portalPage(title: string, user: SessionUser, active: ModuleName, content: string): Response {
  return page(title, `<div class="layout">${nav(user, active)}<main class="main">${content}</main></div>`);
}

export async function dashboardPage(db: D1Database, user: SessionUser): Promise<Response> {
  const [leads, tasks, sales, openTasks] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS total FROM leads').first<{ total: number }>(),
    db.prepare('SELECT COUNT(*) AS total FROM tasks').first<{ total: number }>(),
    db.prepare('SELECT COUNT(*) AS total FROM sales').first<{ total: number }>(),
    db.prepare("SELECT COUNT(*) AS total FROM tasks WHERE status NOT IN ('CONCLUIDO','FINALIZADO')").first<{ total: number }>(),
  ]);
  const metrics: Metric[] = [
    { label: 'Leads', value: String(leads?.total ?? 0), hint: 'captados pela landing' },
    { label: 'Vendas', value: String(sales?.total ?? 0), hint: 'controle comercial' },
    { label: 'Demandas', value: String(tasks?.total ?? 0), hint: 'marketing e dev' },
    { label: 'Pendencias', value: String(openTasks?.total ?? 0), hint: 'tarefas abertas' },
  ];
  return portalPage('Painel - BERN MKT', user, 'dashboard', `<div class="toolbar"><div><div class="eyebrow">Owner e administradores</div><h1>Painel BERN MKT</h1><p style="color:var(--muted)">Controle vendas, marketing, desenvolvimento e operacao em um lugar.</p></div><a class="btn" href="/painel/comercial">Ver comercial</a></div><section class="metrics">${metrics.map((metric) => `<div class="card metric"><strong>${escapeHtml(metric.value)}</strong><b>${escapeHtml(metric.label)}</b><p>${escapeHtml(metric.hint)}</p></div>`).join('')}</section>`);
}

export async function commercialPage(db: D1Database, user: SessionUser): Promise<Response> {
  const leads = (await db.prepare('SELECT id, name, whatsapp, segment, status, created_at FROM leads ORDER BY id DESC LIMIT 40').all<LeadRow>()).results;
  return portalPage('Comercial - BERN MKT', user, 'comercial', `<div class="toolbar"><div><div class="eyebrow">Vendas BERN MKT</div><h1>Comercial</h1><p style="color:var(--muted)">Do Google para a demonstracao: acompanhe leads, WhatsApp, PDF e fechamento.</p></div></div><section class="card"><table class="table"><thead><tr><th>Lead</th><th>WhatsApp</th><th>Segmento</th><th>Status</th></tr></thead><tbody>${leads.map((lead) => `<tr><td>${escapeHtml(lead.name)}</td><td>${escapeHtml(lead.whatsapp)}</td><td>${escapeHtml(lead.segment)}</td><td>${escapeHtml(lead.status)}</td></tr>`).join('') || '<tr><td colspan="4">Nenhum lead ainda.</td></tr>'}</tbody></table></section>`);
}

export async function taskPage(db: D1Database, user: SessionUser, area: TaskArea): Promise<Response> {
  const active = area === 'MARKETING' ? 'marketing' : 'desenvolvimento';
  const title = area === 'MARKETING' ? 'Marketing' : 'Desenvolvimento';
  const tasks = (await db.prepare('SELECT id, title, description, priority, status, due_date FROM tasks WHERE area = ? ORDER BY id DESC LIMIT 80').bind(area).all<TaskRow>()).results;
  const statuses = getStatusesForArea(area);
  return portalPage(`${title} - BERN MKT`, user, active, `<div class="toolbar"><div><div class="eyebrow">Demandas e responsaveis</div><h1>${title}</h1><p style="color:var(--muted)">Crie tarefas, acompanhe status e mantenha o time andando.</p></div></div><section class="card" style="margin-bottom:18px"><form method="post" action="/api/tasks"><input type="hidden" name="area" value="${area}"><label>Tarefa<input class="input" name="title" required></label><label>Descricao<textarea name="description" rows="3"></textarea></label><label>Prioridade<select name="priority"><option>MEDIA</option><option>ALTA</option><option>BAIXA</option></select></label><button class="btn" type="submit">Criar tarefa</button></form></section><section class="board">${statuses.map((status) => `<div class="lane"><strong>${escapeHtml(status)}</strong>${tasks.filter((task) => task.status === status).map((task) => `<article class="task"><b>${escapeHtml(task.title)}</b><p>${escapeHtml(task.description)}</p><small>${escapeHtml(task.priority)}</small></article>`).join('')}</div>`).join('')}</section>`);
}

export async function financePage(db: D1Database, user: SessionUser): Promise<Response> {
  const sales = await db.prepare('SELECT COUNT(*) AS total, COALESCE(SUM(amount_cents), 0) AS amount FROM sales').first<{ total: number; amount: number }>();
  const amount = ((sales?.amount ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return portalPage('Financeiro - BERN MKT', user, 'financeiro', `<div class="eyebrow">Apenas Owner</div><h1>Financeiro</h1><section class="metrics"><div class="card metric"><strong>${sales?.total ?? 0}</strong><b>Vendas</b><p>registradas</p></div><div class="card metric"><strong>${amount}</strong><b>Receita</b><p>valor consolidado</p></div></section>`);
}

export async function usersPage(db: D1Database, user: SessionUser): Promise<Response> {
  const users = (await db.prepare('SELECT id, name, username, role, status FROM users ORDER BY id DESC LIMIT 50').all<SessionUser & { status: string }>()).results;
  return portalPage('Usuarios - BERN MKT', user, 'usuarios', `<div class="eyebrow">Apenas Owner</div><h1>Usuarios</h1><p style="color:var(--muted)">Crie acessos pelo PowerShell para manter senha com hash.</p><section class="card"><table class="table"><thead><tr><th>Nome</th><th>Usuario</th><th>Perfil</th><th>Status</th></tr></thead><tbody>${users.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.username)}</td><td>${escapeHtml(item.role)}</td><td>${escapeHtml(item.status)}</td></tr>`).join('') || '<tr><td colspan="4">Nenhum usuario criado.</td></tr>'}</tbody></table></section>`);
}
