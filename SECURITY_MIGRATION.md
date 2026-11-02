# Security hardening deployment notes

This branch changes authentication. **Do not deploy without a database backup and a maintenance window.** This is a proposed migration and has not been verified against the production server.

## Before deployment

1. Back up `server/data/seanyan.db` and verify the backup can be restored. Do not put this backup in a public GitHub repository.
2. Set `ADMIN_PASSWORD` to a long unique secret (at least 12 characters). Startup now **refuses** an unset/default admin password.
3. Route all frontend and backend traffic through the **same HTTPS origin**. Example: serve the built frontend and `/api` on the same hostname. The browser now uses a SameSite=Strict, HttpOnly session cookie and no longer makes cross-origin requests to the hardcoded API address.
4. Do not expose port 3456 directly to the internet; bind it to loopback and proxy through Nginx.
5. Deploy the frontend and backend together. They are not backward-compatible with the old password and localStorage authentication flows.

## Data migration

The first startup turns previously stored plaintext passwords into salted scrypt hashes in a database transaction. Existing passwords remain usable. **This does not undo any prior plaintext exposure**: recommend password resets, especially where passwords may be reused. The admin password is reset to the required environment value if needed, and old admin sessions are revoked.

Old browser-local password caches are removed by the new frontend. On other devices/browsers, advise users to clear website data if they have previously used an offline version.

## Session and API behavior

- Cookies are HttpOnly, SameSite=Strict, and Secure if NODE_ENV=production.
- Changing/logout removes the server session; deleted users' sessions are revoked.
- Student accounts only access their own `/api/userdata/:userId` and heartbeat. Administrators can inspect student data and activity, manage users, and import question banks.
- Mutating API requests require `X-Requested-With: pymaster` for additional CSRF protection.
- The old client-side automatic registration/login fallback is intentionally **disabled**. Users must have a server connection to authenticate.

## Review checklist before merging

- Install and run `node --test server/security.test.js`.
- Run `npm run build` and `npm run lint` with dependencies installed.
- Run end-to-end checks: register, login, restart/relogin, logout, user A denied user B data, student denied admin routes, admin import, expired sessions, deletion, and backup restoration.
- Check the Capacitor Android build and reverse proxy/cookie behavior separately. If the app loads from a non-HTTP origin, same-origin browser cookies may not work without additional platform integration.
- Audit historical backups and browser caches for older plaintext password copies.
