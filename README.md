# ANIDEX — Full-stack anime OTT starter

A dark, mobile-friendly streaming site using Node.js, Express, vanilla JavaScript and a persistent JSON data store.

## Run on Windows 11

1. Install Node.js 18 or newer (LTS recommended) from https://nodejs.org/
2. Extract this ZIP, open PowerShell in the `anidex` folder.
3. Run `npm install`.
4. Set up the administrator **before first run** (PowerShell):

```powershell
$env:ADMIN_EMAIL="your-email@example.com"
$env:ADMIN_PASSWORD="choose-a-long-unique-password"
npm start
```

5. Open http://localhost:3000
6. Sign in using the admin email and password above. Use the Admin menu to add anime and episodes.

To restart later, run `npm start`. For persistent admin settings, configure environment variables in your hosting provider or shell profile. The initial admin account is only created if the configured email does not already exist.

## Included

- Responsive dark home page, featured banner, anime cards, search and genre filtering
- Register/login with salted scrypt password hashes, random bearer tokens and logout
- Admin-protected anime and episode creation/deletion
- Watchlist and HTML5 watch-progress persistence
- Episode-level and series-level premium authorization on the server
- MP4/HTTPS playback and Google Drive `/file/d/FILE_ID/view` or `/preview` iframe playback
- Demo anime catalog with **fictional titles**, stock photographic placeholder images, and one CC0 sample video
- All persistent data stored in `data/db.json` (created automatically)

## Video upload and Google Drive

In the Admin dashboard, add a title, then add an episode with a video URL. For a Google Drive file, use `https://drive.google.com/file/d/FILE_ID/view` and ensure the file is shared with intended viewers. The player converts it to a preview iframe. Google Drive may restrict embedding, bandwidth, playback, or availability; it is not a dependable production streaming CDN. Use authorized content only.

## Important production limitations

This is a **working starter**, not a production-ready commercial streaming service. Before public launch:

- Replace JSON-file storage with PostgreSQL or another transactional database (JSON files do not scale across multiple server instances).
- Move bearer tokens from localStorage to secure, HttpOnly, SameSite cookies; add CSRF protections where appropriate, rate limits, email verification, password reset, audit logging, session cleanup, and robust validation.
- Add a payment gateway (e.g. Razorpay) with verified server-side webhooks and subscription lifecycle management. **No payments are processed here and there is no self-service premium purchase flow.**
- Add licensed content, production video hosting/CDN, backups, monitoring, and appropriate privacy/terms pages.
- Restrict permitted video/image URL origins as needed and review embedding/CSP protections.
- Use HTTPS and a persistent disk on your hosting provider; the JSON database will be lost on ephemeral storage.

## API

`GET /api/anime`, `GET /api/anime/:id`, `POST /api/register`, `POST /api/login`, `GET /api/me`, `POST /api/logout`, `GET/POST /api/watchlist`, `POST /api/watchlist/:id`, `GET /api/progress`, `PUT /api/progress/:episodeId`, `GET /api/anime/:id/episodes/:episodeId/play`, `POST/DELETE /api/admin/anime`, `POST /api/admin/anime/:id/episodes`, `DELETE /api/admin/anime/:id/episodes/:eid`, `GET /api/health`.

ANIDEX is a demo project; the catalog is not a licensed anime library.
