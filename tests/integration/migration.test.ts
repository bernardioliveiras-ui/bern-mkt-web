import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
it('migrates the populated original database without losing existing data',()=>{
 const db=new DatabaseSync(':memory:');
 try{
 db.exec('PRAGMA foreign_keys=ON');db.exec(readFileSync('migrations/0001_initial.sql','utf8'));
 db.exec("INSERT INTO users (name,username,password_hash,role) VALUES ('Anterior','anterior','hash-preservado','ADMIN_MARKETING'); INSERT INTO leads (name,whatsapp,segment) VALUES ('Lead anterior','11999999999','Corretores'); INSERT INTO tasks (area,title,status) VALUES ('MARKETING','Entrega antiga','CONCLUIDO'); INSERT INTO sales (client_name,plan_name,amount_cents) VALUES ('Cliente','Licenca',25000);");
 db.exec(readFileSync('migrations/0002_ecossistema.sql','utf8'));
 expect(db.prepare('SELECT password_hash FROM users').get()!.password_hash).toBe('hash-preservado');
 expect(db.prepare('SELECT role FROM user_roles').get()!.role).toBe('ADMIN_MARKETING');
 expect(db.prepare('SELECT progress FROM tasks').get()!.progress).toBe(100);
 expect(db.prepare('SELECT name FROM leads').get()!.name).toBe('Lead anterior');
 expect(db.prepare('SELECT amount_cents FROM sales').get()!.amount_cents).toBe(25000);
 }finally{db.close();}
});
