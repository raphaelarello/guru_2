ALTER TABLE users MODIFY COLUMN role ENUM('user','admin','superadmin') NOT NULL DEFAULT 'user';
