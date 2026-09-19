import { login, logout, getSessionUser } from '@/auth';
import { canAccess, type ModuleName } from '@/lib/access';
import { validateLeadInput } from '@/modules/leads';
import { getStatusesForArea, type TaskArea } from '@/modules/tasks';
import {
  commercialPage,
  dashboardPage,
  financePage,
  landingResponse,
  loginPage,
  taskPage,
  usersPage,
} from '@/pages';

function redirect(location: string, headers?: HeadersInit): Response {
  return new Response(null, { status: 302, headers: { Location: location, ...headers } });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json;charset=UTF-8' } });
}

async function readInput(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await request.json()) as Record<string, string>;
  }
  const form = await request.formData();
  return Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
}

async function requireUser(request: Request, env: Env, moduleName: ModuleName): Promise<SessionUser | Response> {
  const user = await getSessionUser(request, env.DB);
  if (!user) return redirect('/entrar');
  if (!canAccess(user.role, moduleName)) return new Response('Acesso restrito ao perfil autorizado.', { status: 403 });
  return user;
}

type SessionUser = Awaited<ReturnType<typeof getSessionUser>> extends infer T ? NonNullable<T> : never;

async function handleLead(request: Request, env: Env): Promise<Response> {
  const input = await readInput(request);
  const parsed = validateLeadInput(input);
  if (!parsed.success) return json({ ok: false, error: 'Dados invalidos' }, 400);

  const lead = parsed.data;
  await env.DB.prepare('INSERT INTO leads (name, whatsapp, segment, message, origin, status) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(lead.name, lead.whatsapp, lead.segment, lead.message, 'landing-seo', 'NOVO')
    .run();

  if ((request.headers.get('accept') ?? '').includes('text/html')) return redirect('/?ok=1#demonstracao');
  return json({ ok: true });
}

async function handleTask(request: Request, env: Env): Promise<Response> {
  const input = await readInput(request);
  const area = input.area as TaskArea;
  if (area !== 'MARKETING' && area !== 'DESENVOLVIMENTO') return json({ ok: false, error: 'Area invalida' }, 400);

  const status = getStatusesForArea(area)[0];
  await env.DB.prepare('INSERT INTO tasks (area, title, description, priority, status, due_date) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(area, input.title ?? '', input.description ?? '', input.priority ?? 'MEDIA', status, input.due_date || null)
    .run();

  return redirect(area === 'MARKETING' ? '/painel/marketing' : '/painel/desenvolvimento');
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (request.method === 'GET' && path === '/') return landingResponse(url);
  if (request.method === 'GET' && path === '/entrar') return loginPage(url.searchParams.get('erro') === '1');

  if (request.method === 'POST' && path === '/api/public/leads') return handleLead(request, env);

  if (request.method === 'POST' && path === '/api/auth/login') {
    const input = await readInput(request);
    const result = await login(env.DB, input.username ?? '', input.password ?? '');
    if (!result) return redirect('/entrar?erro=1');
    return redirect('/painel', { 'Set-Cookie': result.cookie });
  }

  if (request.method === 'GET' && path === '/api/auth/logout') {
    const cookie = await logout(request, env.DB);
    return redirect('/entrar', { 'Set-Cookie': cookie });
  }

  if (request.method === 'POST' && path === '/api/tasks') {
    const user = await requireUser(request, env, 'dashboard');
    if (user instanceof Response) return user;
    return handleTask(request, env);
  }

  if (request.method === 'GET' && path === '/painel') {
    const user = await requireUser(request, env, 'dashboard');
    if (user instanceof Response) return user;
    return dashboardPage(env.DB, user);
  }

  if (request.method === 'GET' && path === '/painel/comercial') {
    const user = await requireUser(request, env, 'comercial');
    if (user instanceof Response) return user;
    return commercialPage(env.DB, user);
  }

  if (request.method === 'GET' && path === '/painel/marketing') {
    const user = await requireUser(request, env, 'marketing');
    if (user instanceof Response) return user;
    return taskPage(env.DB, user, 'MARKETING');
  }

  if (request.method === 'GET' && path === '/painel/desenvolvimento') {
    const user = await requireUser(request, env, 'desenvolvimento');
    if (user instanceof Response) return user;
    return taskPage(env.DB, user, 'DESENVOLVIMENTO');
  }

  if (request.method === 'GET' && path === '/painel/financeiro') {
    const user = await requireUser(request, env, 'financeiro');
    if (user instanceof Response) return user;
    return financePage(env.DB, user);
  }

  if (request.method === 'GET' && path === '/painel/usuarios') {
    const user = await requireUser(request, env, 'usuarios');
    if (user instanceof Response) return user;
    return usersPage(env.DB, user);
  }

  return new Response('Pagina nao encontrada.', { status: 404 });
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return route(request, env);
  },
};
