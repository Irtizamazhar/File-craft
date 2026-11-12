# MySQL management from Beekeeper Studio

Beekeeper Studio is a **database management interface**, not a MySQL server. FileCraft runs with the MySQL database supplied by Hostinger.

## Connect locally

1. Ensure a MySQL Server 8.x instance is installed and running on your PC (or use a permitted remote server).
2. Create a database, e.g. `filecraft`.
3. Use Beekeeper Studio → New Connection → MySQL → Host `127.0.0.1`, port `3306`, username and password you configured.
4. Import and run `sql/schema.sql` in that database.
5. In project `.env.local`, configure `DATABASE_URL=mysql://username:password@127.0.0.1:3306/filecraft` and restart `npm run dev`.

## Connect to the database on Hostinger

1. hPanel → Websites → Manage site → Databases/MySQL, create the database and user.
2. Import `sql/schema.sql` using Hostinger phpMyAdmin.
3. If you need Beekeeper access from your laptop, open hPanel's **Remote MySQL** section, allowlist **your own public IP only**, and use Hostinger's designated database hostname and port `3306` in Beekeeper.
4. The website itself, when hosted on Hostinger, uses `127.0.0.1` in `DATABASE_URL` according to Hostinger's Node.js/MySQL guidance.
5. If your laptop IP changes, update the allowlist. Never allow all IPs just for convenience.

## Tables

`users` stores accounts and password hashes, `sessions` stores hashed session IDs, `activity` stores optional browser-reported tool names/status (not file bytes), `contact_messages` stores messages submitted through the site.

To manually assign an existing account as an administrator, authenticate that it belongs to you, then run from a privileged database connection:

```sql
UPDATE users SET role='admin' WHERE email='your-real-owner-email@example.com';
```

Never put administrator creation functionality on a public registration page.
