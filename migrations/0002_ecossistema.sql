-- Aplicar UMA VEZ no banco existente. Preserva usuarios, leads, tarefas e vendas.
CREATE TABLE user_roles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('OWNER','ADMIN_COMERCIAL','ADMIN_MARKETING','ADMIN_DESENVOLVIMENTO')),
  PRIMARY KEY (user_id, role)
);
INSERT INTO user_roles (user_id, role) SELECT id, role FROM users;
ALTER TABLE tasks ADD COLUMN kind TEXT NOT NULL DEFAULT 'INTERNA';
ALTER TABLE tasks ADD COLUMN created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN creator_name TEXT NOT NULL DEFAULT 'Cadastro anterior';
ALTER TABLE tasks ADD COLUMN progress INTEGER NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100);
ALTER TABLE tasks ADD COLUMN completed_at DATETIME;
ALTER TABLE tasks ADD COLUMN version INTEGER NOT NULL DEFAULT 0;
UPDATE tasks SET progress=100, completed_at=updated_at WHERE status IN ('CONCLUIDO','FINALIZADO');
CREATE TABLE task_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('CRIACAO','ATUALIZACAO','COMENTARIO')),
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_task_events_task ON task_events(task_id, id);
CREATE INDEX idx_tasks_due ON tasks(area, due_date);
ALTER TABLE leads ADD COLUMN next_contact_at DATETIME;
ALTER TABLE leads ADD COLUMN loss_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN version INTEGER NOT NULL DEFAULT 0;
CREATE TABLE lead_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
 actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
 actor_name TEXT NOT NULL,
 body TEXT NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_lead_events ON lead_events(lead_id, id);
CREATE INDEX idx_leads_return ON leads(next_contact_at);
