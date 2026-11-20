# MySQL and Beekeeper Studio
The existing local DATABASE_URL selects filecraft. Credentials were not printed or modified. Beekeeper is a client, not the database server.

Connection fields: host and port are in the private DATABASE_URL; database is filecraft; username and password are stored only in .env.local or the hosting secret settings. For local MySQL the normal host is 127.0.0.1 and port 3306; use the actual configured values. Percent-encode reserved characters in URI credentials.

Run npm.cmd run db:init. This loads Next.js environment files, creates missing tables, and seeds missing plan IDs with INSERT IGNORE. It never drops tables or replaces existing plan configuration. Existing table definitions are preserved. Incompatible existing schema requires review before alteration.

Tables: users, sessions, activity, contact_messages, subscription_plans, subscriptions. Primary keys, email uniqueness, session expiry/user indexes, history user/time index, contact timestamp index and subscription plan/status index are defined in sql/schema.sql. Foreign keys cascade only when the owning user is explicitly deleted.

Safe checks: SELECT 1; SELECT DATABASE(); SHOW TABLES; SHOW INDEX FROM users; SHOW INDEX FROM sessions; SELECT id,name,enabled FROM subscription_plans;

npm.cmd run db:verify verifies connection, database selection and six tables/index inventories. Auth integration tests create a unique @example.invalid user, test real writes and sessions, then delete only that exact disposable user. Related test rows cascade. No production records are reset.

Observed server reports VERSION()=26.7.0 and version_comment=MySQL Community Server - GPL. This is not a verified MySQL 8 environment; repeat on the target Hostinger MySQL 8 server before release.
