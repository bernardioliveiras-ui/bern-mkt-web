import {parseContactCsv,normalizePhone,saveImportChunk} from '@/modules/import-leads';
import { brandAsset } from '@/brand';
import bcrypt from 'bcryptjs';
import { login, logout, getSessionUser, type SessionUser } from '@/auth';
import { canAccess, isOwner, ROLES, type Role, type ModuleName } from '@/lib/access';
import { validateLeadInput, isLeadStatus } from '@/modules/leads';
import { AREAS, getStatusesForArea, moduleForArea, isDone, listMembers, type TaskArea, type TaskRow } from '@/modules/tasks';
import { importLeadsPage, commercialPage, dashboardPage, financePage, landingResponse, loginPage, taskPage, taskDetailPage, usersPage, passwordPage, leadDetailPage, errorPage } from '@/pages';

function redirect(location: string, headers?: Record<string,string>): Response {
  return new Response(null, { status:302, headers:{Location:location,...headers} });
}
function json(data: unknown, status=200) { return new Response(JSON.stringify(data), {status,headers:{'content-type':'application/json;charset=UTF-8'}}); }
class HttpError extends Error { constructor(public status:number, message:string) { super(message); } }
function check(ok: unknown, message:string, status=400): asserts ok { if (!ok) throw new HttpError(status,message); }
type Input = Record<string, string | string[]>;
const FIELD_LABELS:Record<string,string>={name:'nome',username:'usuário',password:'senha',title:'título',description:'descrição',body:'mensagem',notes:'anotações',loss_reason:'motivo da perda',area:'setor',priority:'prioridade',status:'etapa',roles:'áreas de acesso',due_date:'prazo',responsible_user_id:'responsável',assigned_to_user_id:'responsável',demo_at:'demonstração',next_contact_at:'próximo retorno',current_password:'senha atual',confirmation:'confirmação da senha',confirm_username:'confirmação do usuário',kind:'tipo de tarefa',progress:'progresso',version:'atualização'};

async function readInput(request:Request): Promise<Input> {
  if ((request.headers.get('content-type')??'').includes('application/json')) return await request.json() as Input;
  const result:Input={};
  for (const [key,value] of await request.formData()) {
    const text=String(value); const old=result[key];
    result[key]=old===undefined ? text : Array.isArray(old) ? [...old,text] : [old,text];
  }
  return result;
}
function str(input:Input,key:string):string { const v=input[key]; check(v===undefined || typeof v==='string','Confira o campo '+(FIELD_LABELS[key]??'informado')+'.'); return v??''; }
function text(input:Input,key:string,max:number,required=false):string { const v=str(input,key).trim(); check(v.length<=max && (!required||v.length>0),'Preencha corretamente o campo '+(FIELD_LABELS[key]??'informado')+'.');return v; }
function date(input:Input,key:string,time=false):string|null {
  const v=str(input,key); if(!v)return null;
  check((time?/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/:/^\d{4}-\d{2}-\d{2}$/).test(v)&&!Number.isNaN(Date.parse(v)),'Data inválida.');
  const day=v.slice(0,10);check(new Date(day+'T00:00:00Z').toISOString().slice(0,10)===day,'Data inválida.');return v;
}
async function requireUser(request:Request,env:Env,module:ModuleName,allowPassword=false):Promise<SessionUser|Response> {
 const user=await getSessionUser(request,env.DB);
 if(!user)return redirect('/entrar');
 if(user.must_change_password&&!allowPassword)return redirect('/painel/senha');
 if(!canAccess(user.roles??user.role,module))throw new HttpError(403,'Você não tem acesso a esta área.');
 return user;
}
async function assignee(db:D1Database,area:TaskArea,input:Input,key='responsible_user_id'):Promise<number|null>{
 const v=str(input,key);if(!v)return null;
 const id=Number(v);check(Number.isSafeInteger(id)&&id>0,'Responsável inválido.');
 check((await listMembers(db,area)).some(u=>u.id===id),'Escolha um usuário ativo com acesso ao setor.');return id;
}
function parseRoles(input:Input):Role[]{
 const value=input.roles;const roles=[...new Set(Array.isArray(value)?value:value?[value]:[])];
 check(roles.length>0&&roles.every(r=>ROLES.includes(r as Role)),'Selecione pelo menos uma área válida.');
 return roles.includes('OWNER')?['OWNER']:roles as Role[];
}
function validPassword(password:string){check(password.length>=8&&new TextEncoder().encode(password).length<=72,'A senha precisa ter pelo menos 8 caracteres e no máximo 72 bytes.');}
async function handleUser(request:Request,env:Env,user:SessionUser,id?:number,remove=false):Promise<Response>{
 const input=await readInput(request);const db=env.DB;
 if(id){
  const target=await db.prepare('SELECT id,username,name FROM users WHERE id=?').bind(id).first<{id:number;username:string;name:string}>();
  check(target,'Usuário não encontrado.',404);
  if(remove){
   check(id!==user.id,'Você não pode excluir a própria conta.');
   check(str(input,'confirm_username')===target.username,'Digite o login exato para confirmar a exclusão.');
   await db.prepare('DELETE FROM users WHERE id=?').bind(id).run();
   return redirect('/painel/usuarios?ok=excluido');
  }
  const roles=parseRoles(input);const status=str(input,'status');const name=text(input,'name',100,true);
  check(['ATIVO','INATIVO'].includes(status),'Status inválido.');
  check(id!==user.id||(roles.includes('OWNER')&&status==='ATIVO'),'Mantenha sua própria conta como proprietário ativo.');
  const password=str(input,'password');if(password)validPassword(password);
  const statements=[db.prepare('UPDATE users SET name=?,role=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(name,roles[0],status,id),db.prepare('DELETE FROM user_roles WHERE user_id=?').bind(id),...roles.map(r=>db.prepare('INSERT INTO user_roles (user_id,role) VALUES (?,?)').bind(id,r))];
  if(password) statements.push(db.prepare('UPDATE users SET password_hash=?,must_change_password=1 WHERE id=?').bind(await bcrypt.hash(password,12),id));
  statements.push(db.prepare('DELETE FROM sessions WHERE user_id=?').bind(id));
  await db.batch(statements);
  return redirect(id===user.id?'/entrar':'/painel/usuarios?ok=atualizado');
 }
 const roles=parseRoles(input);const name=text(input,'name',100,true);const username=text(input,'username',64,true);const password=str(input,'password');
 check(/^[A-Za-z0-9_.-]{3,64}$/.test(username),'Use um login de 3 a 64 letras, números, ponto, hífen ou sublinhado.');validPassword(password);
 check(!await db.prepare('SELECT id FROM users WHERE username=? COLLATE NOCASE').bind(username).first(),'Esse login já existe. Edite o usuário cadastrado.',409);
 await db.batch([db.prepare('INSERT INTO users (name,username,password_hash,role) VALUES (?,?,?,?)').bind(name,username,await bcrypt.hash(password,12),roles[0]),...roles.map(r=>db.prepare('INSERT INTO user_roles (user_id,role) SELECT id,? FROM users WHERE username=?').bind(r,username))]);
 return redirect('/painel/usuarios?ok=criado');
}
async function handleTask(request:Request,env:Env,user:SessionUser):Promise<Response>{
 const input=await readInput(request), area=str(input,'area') as TaskArea;
 check(AREAS.includes(area),'Área inválida.');check(canAccess(user.roles??user.role,moduleForArea(area)),'Você não pode criar trabalho para outro setor.',403);
 const kind=str(input,'kind')||'INTERNA';check(['INTERNA','SOLICITACAO'].includes(kind),'Tipo inválido.');
 check(kind!=='SOLICITACAO'||isOwner(user),'Somente o proprietário envia solicitações aos setores.',403);
 const title=text(input,'title',180,true),description=text(input,'description',10000),priority=str(input,'priority')||'MEDIA';
 check(['BAIXA','MEDIA','ALTA','URGENTE'].includes(priority),'Prioridade inválida.');
 const responsible=await assignee(env.DB,area,input),due=date(input,'due_date');
 const result=await env.DB.batch([
 env.DB.prepare('INSERT INTO tasks (area,title,description,priority,status,due_date,kind,created_by_user_id,creator_name,responsible_user_id) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(area,title,description,priority,'A_FAZER',due,kind,user.id,user.name,responsible),
 env.DB.prepare("INSERT INTO task_events (task_id,actor_user_id,actor_name,type,body) VALUES (last_insert_rowid(),?,?,'CRIACAO',?)").bind(user.id,user.name,kind==='SOLICITACAO'?'Solicitação enviada ao setor.':'Tarefa interna criada.')]);
 return redirect('/painel/tarefas/'+result[0].meta.last_row_id);
}
async function getTask(db:D1Database,id:number,user:SessionUser):Promise<TaskRow>{
 const task=await db.prepare('SELECT t.*,u.name AS responsible_name FROM tasks t LEFT JOIN users u ON u.id=t.responsible_user_id WHERE t.id=?').bind(id).first<TaskRow>();
 check(task,'Tarefa não encontrada.',404);check(canAccess(user.roles??user.role,moduleForArea(task.area)),'Acesso restrito ao setor da tarefa.',403);return task;
}
async function updateTask(request:Request,env:Env,user:SessionUser,id:number,comment:boolean):Promise<Response>{
 const task=await getTask(env.DB,id,user),input=await readInput(request);
 if(comment){
  const body=text(input,'body',5000,true);
  await env.DB.prepare("INSERT INTO task_events (task_id,actor_user_id,actor_name,type,body) VALUES (?,?,?,'COMENTARIO',?)").bind(id,user.id,user.name,body).run();
 }else{
  const status=str(input,'status');check(getStatusesForArea(task.area).includes(status),'Etapa inválida.');
  check(!(task.kind==='SOLICITACAO'&&isDone(status)&&!isOwner(user)),'Envie para revisão. O proprietário aprova a conclusão da solicitação.',403);
  check(!(task.kind==='SOLICITACAO'&&isDone(task.status)&&!isOwner(user)),'Somente o proprietário pode reabrir uma solicitação concluída.',403);
  let progress=Number(str(input,'progress'));check(Number.isInteger(progress)&&progress>=0&&progress<=100,'Progresso precisa estar entre 0 e 100.');
  if(isDone(status))progress=100;
  check(isDone(status)||progress<100,'Use até 99% enquanto a tarefa não estiver concluída.');
  const responsible=await assignee(env.DB,task.area,input);
  const version=str(input,'version');check(!version||Number(version)===task.version,'Esta tarefa mudou. Reabra a página antes de salvar.',409);
  const priority=isOwner(user)?str(input,'priority')||task.priority:task.priority;
  check(['BAIXA','MEDIA','ALTA','URGENTE'].includes(priority),'Prioridade inválida.');
  const due=isOwner(user)&&input.due_date!==undefined?date(input,'due_date'):task.due_date;
  const body=`Etapa: ${status}. Progresso: ${progress}%. Responsável: ${responsible?(await listMembers(env.DB,task.area)).find(u=>u.id===responsible)?.name:'Não atribuído'}. Prazo: ${due||'Não definido'}. Prioridade: ${priority}.`;
  const results=await env.DB.batch([
   env.DB.prepare(`UPDATE tasks SET status=?,progress=?,responsible_user_id=?,priority=?,due_date=?,completed_at=${isDone(status)?'CURRENT_TIMESTAMP':'NULL'},updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=? AND version=?`).bind(status,progress,responsible,priority,due,id,task.version),
   env.DB.prepare("INSERT INTO task_events (task_id,actor_user_id,actor_name,type,body) SELECT ?,?,?,'ATUALIZACAO',? WHERE changes()=1").bind(id,user.id,user.name,body)]);
  check(Number(results[0].meta.changes)===1,'Outra pessoa atualizou esta tarefa. Recarregue a página.',409);
 }
 return redirect('/painel/tarefas/'+id);
}
async function updateLead(request:Request,env:Env,user:SessionUser,id:number):Promise<Response>{
 const lead=await env.DB.prepare('SELECT * FROM leads WHERE id=?').bind(id).first<Record<string,any>>();check(lead,'Lead não encontrado.',404);
 const input=await readInput(request),status=str(input,'status');check(isLeadStatus(status),'Etapa inválida.');
 const name=input.name===undefined?lead.name:text(input,'name',100,true);
 const loss=text(input,'loss_reason',500);check(status!=='PERDIDO'||loss.length>0,'Informe o motivo da perda.');
 const assigned=await assignee(env.DB,'COMERCIAL',input,'assigned_to_user_id'),demo=date(input,'demo_at',true),next=status==='NAO_CONTATAR'?null:date(input,'next_contact_at',true),notes=text(input,'notes',10000);
 check(status!=='DEMO_MARCADA'||demo,'Informe a data e o horário da demonstração.');
 const version=str(input,'version');check(!version||Number(version)===lead.version,'Este lead mudou. Reabra antes de salvar.',409);
 const result=await env.DB.batch([
 env.DB.prepare('UPDATE leads SET name=?,status=?,assigned_to_user_id=?,demo_at=?,next_contact_at=?,notes=?,loss_reason=?,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=? AND version=?').bind(name,status,assigned,demo,next,notes,loss,id,lead.version),
 env.DB.prepare('INSERT INTO lead_events (lead_id,actor_user_id,actor_name,body) SELECT ?,?,?,? WHERE changes()=1').bind(id,user.id,user.name,`Etapa: ${status}. Responsável: ${assigned?(await listMembers(env.DB,'COMERCIAL')).find(u=>u.id===assigned)?.name:'Não atribuído'}. Demonstração: ${demo||'—'}. Retorno: ${next||'—'}. ${loss?'Motivo: '+loss+'. ':''}Notas: ${notes||'—'}`)]);
 check(Number(result[0].meta.changes)===1,'Outra pessoa atualizou este lead. Recarregue.',409);return redirect('/painel/leads/'+id);
}
async function route(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'')||'/';
 if(request.method==='POST'){
  const origin=request.headers.get('origin');check(!origin||origin===url.origin,'Origem da solicitação não permitida.',403);
  check(request.headers.get('sec-fetch-site')!=='cross-site','Origem da solicitação não permitida.',403);
 }
 if(request.method==='GET'){const asset=brandAsset(path);if(asset)return asset;}
 if(path==='/painel/comercial/importar'||path==='/api/leads/import/preview'||path==='/api/leads/import/commit'){
  const user=await requireUser(request,env,'comercial');if(user instanceof Response)return user;
  if(request.method==='GET'&&path==='/painel/comercial/importar')return importLeadsPage(env.DB,user);
  check(request.method==='POST','Método não permitido.',405);
  const reader=request.body?.getReader();check(reader,'Envie uma lista.');let size=0;const chunks:Uint8Array[]=[];
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>300000){await reader.cancel();throw new HttpError(413,'Use um arquivo de até 250 KB.');}chunks.push(part.value);}
  const bytes=new Uint8Array(size);let pos=0;for(const c of chunks){bytes.set(c,pos);pos+=c.length;}
  const bounded=new Request(request.url,{method:'POST',headers:request.headers,body:bytes});
  if(path.endsWith('/preview')){
   const form=await bounded.formData(),file=form.get('file'),pasted=String(form.get('csv')||'');
   check(!(file instanceof File&&file.size&&pasted.trim()),'Escolha arquivo ou texto colado.');
   let csv=pasted;if(file instanceof File&&file.size){check(file.size<=250000,'Use um arquivo de até 250 KB.');const data=await file.arrayBuffer();try{csv=new TextDecoder('utf-8',{fatal:true}).decode(data);}catch{csv=new TextDecoder('windows-1252').decode(data);}}
   const input:Input={list:String(form.get('list')||''),segment:String(form.get('segment')||''),assigned_to_user_id:String(form.get('assigned_to_user_id')||'')};
   const list=text(input,'list',80,true),segment=text(input,'segment',80,true);await assignee(env.DB,'COMERCIAL',input,'assigned_to_user_id');
   let parsed;try{parsed=parseContactCsv(csv);}catch(error){throw new HttpError(400,error instanceof Error?error.message:'CSV inválido.');}
   return importLeadsPage(env.DB,user,parsed,list,segment,str(input,'assigned_to_user_id'));
  }
  let input:any;try{input=await bounded.json();}catch{throw new HttpError(400,'Dados inválidos.');}
  check(input&&Array.isArray(input.contacts)&&input.contacts.length>0&&input.contacts.length<=20,'Envie até 20 contatos por lote.');
  const list=text(input,'list',80,true),segment=text(input,'segment',80,true),assigned=await assignee(env.DB,'COMERCIAL',input,'assigned_to_user_id');
  const contacts=input.contacts.map((c:any)=>{check(c&&typeof c.phone==='string'&&typeof c.name==='string','Contato inválido.');const phone=normalizePhone(c.phone),name=c.name.trim();check(phone&&name.length>0&&name.length<=100,'Nome ou telefone inválido.');return {phone,name};});
  return json(await saveImportChunk(env.DB,contacts,list,segment,assigned));
 }
 if(request.method==='GET'&&path==='/')return landingResponse(url);
 if(request.method==='GET'&&path==='/entrar')return loginPage(url.searchParams.get('erro')==='1');
 if(request.method==='POST'&&path==='/api/public/leads'){
  const parsed=validateLeadInput(await readInput(request));if(!parsed.success)return json({ok:false,error:'Dados inválidos'},400);
  const lead=parsed.data;
  await env.DB.prepare('INSERT INTO leads (name,whatsapp,segment,message,origin,status) VALUES (?,?,?,?,?,?)').bind(lead.name,lead.whatsapp,lead.segment,lead.message,'landing-seo','NOVO').run();
  return (request.headers.get('accept')??'').includes('text/html')?redirect('/?ok=1#demonstracao'):json({ok:true});
 }
 if(request.method==='POST'&&path==='/api/auth/login'){
  const input=await readInput(request);const result=await login(env.DB,str(input,'username'),str(input,'password'));
  return result?redirect(result.user.must_change_password?'/painel/senha':'/painel',{'Set-Cookie':result.cookie}):redirect('/entrar?erro=1');
 }
 if(request.method==='POST'&&path==='/api/auth/logout')return redirect('/entrar',{'Set-Cookie':await logout(request,env.DB)});
 if(path==='/painel/senha'||path==='/api/auth/password'){
  const user=await requireUser(request,env,'dashboard',true);if(user instanceof Response)return user;
  if(request.method==='GET'&&path==='/painel/senha')return passwordPage(user);
  if(request.method==='POST'&&path==='/api/auth/password'){
   const input=await readInput(request),password=str(input,'password');validPassword(password);check(password===str(input,'confirmation'),'As senhas não coincidem.');check(password!==str(input,'current_password'),'Escolha uma senha diferente da inicial.');
   const row=await env.DB.prepare('SELECT password_hash FROM users WHERE id=?').bind(user.id).first<{password_hash:string}>();check(row&&await bcrypt.compare(str(input,'current_password'),row.password_hash),'Senha atual incorreta.');
   await env.DB.batch([env.DB.prepare('UPDATE users SET password_hash=?,must_change_password=0,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(await bcrypt.hash(password,12),user.id),env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id)]);
   return redirect('/entrar',{'Set-Cookie':await logout(request,env.DB)});
  }
 }
 if(path.startsWith('/api/users')){
  const user=await requireUser(request,env,'usuarios');if(user instanceof Response)return user;
  if(request.method==='POST'&&path==='/api/users')return handleUser(request,env,user);
  const match=path.match(/^\/api\/users\/(\d+)(\/delete)?$/);if(request.method==='POST'&&match)return handleUser(request,env,user,Number(match[1]),!!match[2]);
 }
 if(path.startsWith('/api/tasks')){
  const user=await requireUser(request,env,'dashboard');if(user instanceof Response)return user;
  if(request.method==='POST'&&path==='/api/tasks')return handleTask(request,env,user);
  const match=path.match(/^\/api\/tasks\/(\d+)\/(update|comments)$/);if(request.method==='POST'&&match)return updateTask(request,env,user,Number(match[1]),match[2]==='comments');
 }
 const deleteLeadMatch=path.match(/^\/api\/leads\/(\d+)\/delete$/);
 if(deleteLeadMatch){
  const user=await requireUser(request,env,'comercial');if(user instanceof Response)return user;
  check(request.method==='POST','Método não permitido.',405);
  const id=Number(deleteLeadMatch[1]),input=await readInput(request);
  check(str(input,'confirmation')==='EXCLUIR','Digite EXCLUIR para confirmar.');
  const version=str(input,'version');check(/^\d+$/.test(version),'Reabra a ficha antes de excluir.');
  const lead=await env.DB.prepare('SELECT id,version FROM leads WHERE id=?').bind(id).first<{id:number;version:number}>();
  check(lead,'Lead não encontrado.',404);
  check(lead.version===Number(version),'Este lead mudou. Reabra a ficha antes de excluir.',409);
  const result=await env.DB.prepare('DELETE FROM leads WHERE id=? AND version=?').bind(id,Number(version)).run();
  check(Number(result.meta.changes)===1,'Este lead mudou. Reabra a ficha antes de excluir.',409);
  return redirect('/painel/comercial?deleted=1');
 }
 const leadMatch=path.match(/^\/(api|painel)\/leads\/(\d+)$/);
 if(leadMatch){
  const user=await requireUser(request,env,'comercial');if(user instanceof Response)return user;
  if(request.method==='POST'&&leadMatch[1]==='api')return updateLead(request,env,user,Number(leadMatch[2]));
  if(request.method==='GET'&&leadMatch[1]==='painel')return leadDetailPage(env.DB,user,Number(leadMatch[2]));
 }
 const taskMatch=path.match(/^\/painel\/tarefas\/(\d+)$/);
 if(request.method==='GET'&&taskMatch){const user=await requireUser(request,env,'dashboard');if(user instanceof Response)return user;return taskDetailPage(env.DB,user,await getTask(env.DB,Number(taskMatch[1]),user));}
 const modules:Record<string,ModuleName>={'/painel':'dashboard','/painel/comercial':'comercial','/painel/marketing':'marketing','/painel/desenvolvimento':'desenvolvimento','/painel/financeiro':'financeiro','/painel/usuarios':'usuarios','/painel/tarefas/comercial':'comercial'};
 const module=modules[path];
 if(request.method==='GET'&&module){
  const user=await requireUser(request,env,module);if(user instanceof Response)return user;
  if(path==='/painel/tarefas/comercial')return taskPage(env.DB,user,'COMERCIAL',url);
  if(module==='dashboard')return dashboardPage(env.DB,user);
  if(module==='usuarios')return usersPage(env.DB,user,url);
  if(module==='financeiro')return financePage(env.DB,user);
  if(module==='comercial')return commercialPage(env.DB,user,url);
  return taskPage(env.DB,user,module==='marketing'?'MARKETING':'DESENVOLVIMENTO',url);
 }
 return errorPage('Página não encontrada.',404);
}
export default {
 async fetch(request:Request,env:Env):Promise<Response>{
  let response:Response;
  try{response=await route(request,env);}catch(e){
   if(e instanceof HttpError)response=errorPage(e.message,e.status);
   else{console.error(e instanceof Error?e.message:'Falha no servidor');response=errorPage('Não foi possível concluir agora. Tente novamente em instantes. Se o problema continuar, fale com o responsável pelo portal.',500);}
  }
  response.headers.set('X-Content-Type-Options','nosniff');response.headers.set('Referrer-Policy','same-origin');response.headers.set('X-Frame-Options','DENY');
  if(!['/','/brand-v022.png','/favicon-v022.svg','/favicon-v024.png','/favicon.png','/favicon.ico'].includes(new URL(request.url).pathname))response.headers.set('Cache-Control','no-store');
  return response;
 }
};
