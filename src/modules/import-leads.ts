export type ImportContact={name:string;phone:string};
export function normalizePhone(value:string):string|null {
 let n=value.trim().replace(/[\s()+.\-]/g,'');
 if(!/^\d+$/.test(n))return null;
 if(n.startsWith('0055'))n=n.slice(2);
 if(n.length===12||n.length===13){if(!n.startsWith('55'))return null;n=n.slice(2);}
 if(!/^[1-9][0-9](?:9[0-9]{8}|[2-5][0-9]{7})$/.test(n))return null;
 const ddds='11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99'.split(' ');
 return ddds.includes(n.slice(0,2))?'55'+n:null;
}
export function parseContactCsv(text:string){
 if(text.length>250000)throw new Error('Use um arquivo de até 250 KB.');
 text=text.replace(/^\uFEFF/,'');
 const first=text.split(/\r?\n/)[0];const delimiter=first.includes(';')?';':first.includes('\t')?'\t':',';
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
  else if(!quoted&&c===delimiter){row.push(cell);cell='';}
  else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}
  else cell+=c;
 }
 if(quoted)throw new Error('Confira as aspas do CSV.');
 row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
 if(!rows.length)throw new Error('A lista está vazia.');
 const header=rows[0].map(v=>v.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
 let phoneCol=header.findIndex(v=>['numero','telefone','whatsapp','celular','phone'].includes(v)),nameCol=header.findIndex(v=>['nome','name'].includes(v));
 const hasHeader=phoneCol>=0;if(hasHeader)rows.shift();else {if(rows.some(r=>r.length!==1))throw new Error('Use cabeçalho Nome,Numero ou uma coluna somente de telefones.');phoneCol=0;nameCol=-1;}
 if(rows.length>1000)throw new Error('Importe até 1.000 linhas por arquivo.');
 const seen=new Set<string>(),contacts:ImportContact[]=[],issues:{line:number;reason:string}[]=[];let duplicates=0;
 rows.forEach((r,i)=>{const phone=normalizePhone(r[phoneCol]||'');if(!phone){issues.push({line:i+(hasHeader?2:1),reason:'Telefone inválido ou sem DDD'});return;}
 if(seen.has(phone)){duplicates++;return;}seen.add(phone);
 const name=nameCol>=0?(r[nameCol]||'').trim():'';
 if(name.length>100){issues.push({line:i+(hasHeader?2:1),reason:'Nome com mais de 100 caracteres'});return;}
 contacts.push({name:name||'Contato '+phone.slice(-4),phone});});
 return {contacts,issues,duplicates,total:rows.length};
}
// Normalize common formatting of legacy LP phones inside the atomic insert.
export const PHONE_SQL="CASE WHEN length(replace(replace(replace(replace(replace(replace(trim(whatsapp),' ',''),'+',''),'-',''),'(',''),')',''),'.','')) IN (10,11) THEN '55' ELSE '' END || replace(replace(replace(replace(replace(replace(trim(whatsapp),' ',''),'+',''),'-',''),'(',''),')',''),'.','')";
export async function saveImportChunk(db:D1Database,contacts:ImportContact[],list:string,segment:string,assigned:number|null){
 const statements=contacts.map(c=>db.prepare(`INSERT INTO leads (name,whatsapp,segment,origin,status,assigned_to_user_id) SELECT ?,?,?,?,'NOVO',? WHERE NOT EXISTS(SELECT 1 FROM leads WHERE (${PHONE_SQL})=?)`).bind(c.name,c.phone,segment,'prospeccao:'+list,assigned,c.phone));
 const results=await db.batch(statements);const inserted=results.reduce((n,r)=>n+Number(r.meta.changes||0),0);
 return {inserted,skipped:contacts.length-inserted};
}
