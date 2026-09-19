import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const cli=resolve(root,'node_modules/wrangler/bin/wrangler.js');
const scope=process.argv.includes('--local')?'--local':'--remote';
function run(args,capture=false){
 const r=spawnSync(process.execPath,[cli,...args],{cwd:root,encoding:'utf8',stdio:capture?'pipe':'inherit'});
 if(r.error)throw r.error;
 if(r.status!==0){if(capture)console.error(r.stderr||r.stdout);throw new Error('Operacao interrompida. Nenhuma publicacao foi iniciada.');}
 return r.stdout;
}
function query(sql){
 const out=run(['d1','execute','DB',scope,'--command',sql,'--json'],true);
 let data;try{data=JSON.parse(out);}catch{throw new Error('Resposta inesperada do Wrangler. Banco nao alterado.');}
 if(!Array.isArray(data)||!data.every(x=>x.success))throw new Error('Nao foi possivel consultar o banco.');
 return data.flatMap(x=>x.results||[]);
}
try{
 const tables=query("SELECT name FROM sqlite_master WHERE type='table'").map(r=>r.name);
 const base=['users','sessions','leads','tasks','sales'];
 if(!tables.includes('users')){
  if(base.some(t=>tables.includes(t)))throw new Error('Estrutura parcial encontrada. Nao continue sem revisar o banco.');
  run(['d1','execute','DB',scope,'--file','migrations/0001_initial.sql','--yes']);
 }else if(!base.every(t=>tables.includes(t)))throw new Error('Estrutura inicial incompleta. Atualizacao interrompida.');
 const taskColumns=query('PRAGMA table_info(tasks)').map(r=>r.name),leadColumns=query('PRAGMA table_info(leads)').map(r=>r.name);
 const taskNew=['kind','created_by_user_id','creator_name','progress','completed_at','version'],leadNew=['next_contact_at','loss_reason','version'],newTables=['user_roles','task_events','lead_events'];
 const all=taskNew.every(c=>taskColumns.includes(c))&&leadNew.every(c=>leadColumns.includes(c))&&newTables.every(t=>tables.includes(t));
 const any=taskNew.some(c=>taskColumns.includes(c))||leadNew.some(c=>leadColumns.includes(c))||newTables.some(t=>tables.includes(t));
 if(all){console.log('Banco ja atualizado. Usuarios e dados preservados.');process.exit(0);}
 if(any)throw new Error('Atualizacao parcial encontrada. Pare e envie o erro para revisao.');
 mkdirSync(resolve(root,'backups'),{recursive:true});
 const backup='backups/bern-antes-v020-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sql';
 console.log('Salvando copia do banco antes da atualizacao...');
 run(['d1','export','DB',scope,'--output',backup]);
 run(['d1','execute','DB',scope,'--file','migrations/0002_ecossistema.sql','--yes']);
 if(!query('PRAGMA table_info(tasks)').some(c=>c.name==='progress'))throw new Error('Nao foi possivel confirmar a atualizacao.');
 console.log('Banco atualizado. Copia anterior em '+backup);
}catch(e){console.error('ERRO: '+e.message);process.exit(1);}
