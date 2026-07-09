# Dancers Ink — App Documentation

## Project Rules

This project follows the global Claude Design OS defaults (`~/.claude/CLAUDE.md`): premium, human, accessible, no AI-generated or generic-SaaS feel. No em dashes anywhere — code comments, docs, or in-app copy.

Dev server default is port 5173 (`vite.config.js`). If that port is taken, Vite auto-increments (has run on 5175+ before) — check the actual terminal output rather than assuming 5173.

## What this is
A PWA-first mobile app for Dancers Ink dance studio (Mesa, AZ). Parents install it to their iPhone/iPad home screen via Safari. It provides:
- Role-based login (admin / parent)
- Admin dashboard: CRUD for users, classes, announcements, media
- User dashboard: enrolled classes, announcements, media library, chatbot (Iris)
- Installable as a home-screen app on iPhone via Safari

## Architecture

| Layer | Tech | Why |
|---|---|---|
| Frontend | React 18 + Vite 6 | Fast builds, excellent PWA plugin, small output |
| PWA | vite-plugin-pwa + Workbox | Auto service worker, manifest, offline cache |
| Database | Supabase (PostgreSQL) | Free tier, Row Level Security, real-time, auth |
| Auth | Supabase Auth | Email/password, free SMTP, JWT sessions |
| Storage | Supabase Storage | 1GB free for media files |
| Hosting | Cloudflare Pages | Free, unlimited requests, global CDN |
| Icons | lucide-react | Lightweight, tree-shakeable |
| QR Code | api.qr-server.com | Free, no API key, URL parameter driven |

## Run locally

```bash
# 1. Install dependencies
cd dancers-ink-app
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your Supabase project URL and anon key

# 3. Set up database
# Go to https://supabase.com/dashboard → your project → SQL Editor
# Paste and run the contents of supabase/schema.sql

# 4. Create demo users (optional)
# In Supabase: Authentication → Users → Add user
#   admin@dancersink.app / demo1234
#   parent@dancersink.app / demo1234
# Then in SQL Editor:
#   update profiles set role = 'admin' where email = 'admin@dancersink.app';

# 5. Set up storage bucket
# In Supabase: Storage → New bucket → name: "media" → Public: ON
# Then run the storage policy SQL at the bottom of schema.sql

# 6. Start dev server
npm run dev
# Opens at http://localhost:5173
```

## Deploy for free (Cloudflare Pages)

```bash
# Option A: Git-connected (recommended)
# 1. Push repo to GitHub
# 2. Go to https://dash.cloudflare.com → Pages → Create a project
# 3. Connect your GitHub repo
# 4. Build settings:
#    Framework: Vite
#    Build command: npm run build
#    Output directory: dist
# 5. Add environment variables:
#    VITE_SUPABASE_URL = https://xxx.supabase.co
#    VITE_SUPABASE_ANON_KEY = eyJ...
# 6. Deploy → you get a free .pages.dev URL

# Option B: Manual CLI deploy
npm install -g wrangler
npm run build
wrangler pages deploy dist --project-name dancers-ink
```

## Make it installable on iPhone

1. Deploy to Cloudflare Pages (you need HTTPS — Cloudflare provides it free)
2. Visit your URL in Safari on iPhone
3. Tap the Share button → "Add to Home Screen"
4. iOS will use `apple-touch-icon.png` as the icon

**Important:** For the icon to display correctly on iOS, you need a 180×180 PNG at `public/icons/apple-touch-icon.png`.
To generate it from the SVG:
```bash
# If you have ImageMagick:
convert public/icons/icon.svg -resize 512x512 public/icons/icon-512.png
convert public/icons/icon.svg -resize 192x192 public/icons/icon-192.png
convert public/icons/icon.svg -resize 180x180 public/icons/apple-touch-icon.png
```
Or use https://realfavicongenerator.net — upload the SVG, download all sizes.

## PWA features
- Service worker auto-registers via vite-plugin-pwa
- Static assets cached on install (cache-first)
- Supabase API calls use network-first with 5-minute fallback
- Google Fonts cached for 1 year
- Offline fallback: cached pages work, DB reads show last-known data

## User roles
| Role | Access |
|---|---|
| `parent` | App shell: home, classes, media, chat, profile |
| `admin` | Everything above + full admin dashboard at /admin |

### Promote a user to admin
```sql
update public.profiles set role = 'admin' where email = 'their@email.com';
```

## Database tables
| Table | Purpose |
|---|---|
| `profiles` | Extends auth.users — name, role, phone |
| `classes` | All dance classes with schedule and pricing |
| `user_classes` | Which classes each parent has selected |
| `announcements` | Studio-wide messages shown in the app |
| `media_items` | Videos, audio, images, documents |
| `chatbot_settings` | Iris chatbot config (singleton row, id=1) |

## What is strictly free (forever)

- Cloudflare Pages hosting: free, no request limits, free SSL
- Supabase free tier: 500MB DB, 1GB storage, 50k MAU, free SMTP
- qr-server.com QR codes: free, no auth, URL-based
- vite-plugin-pwa / Workbox: open source
- lucide-react: MIT license
- React, Vite: MIT license

## What would cost money at scale

| Feature | Free limit | When it costs |
|---|---|---|
| Supabase MAU | 50,000/month | >50k users |
| Supabase Storage | 1 GB | Large video uploads |
| Supabase DB | 500 MB | Large data |
| Real AI chatbot | $0 free trial only | Any real OpenAI/Claude API usage |
| Push notifications | FCM free, but requires backend | If adding a push server |
| Native iOS app | Apple Dev Program $99/yr | If going to App Store |
| Custom domain email | Varies | Transactional email at scale |

## Future upgrades (when to spend money)

1. **More storage**: Move media to Cloudflare R2 ($0.015/GB after 10GB free — very cheap)
2. **Real AI chatbot**: Wire `chatbot_settings.api_key` to Claude API or OpenAI — pay per token
3. **Push notifications**: Add FCM (free) + Supabase Edge Function to trigger notifications
4. **Native app**: Export to Capacitor (free) → submit to App Store ($99/yr Apple Dev)
5. **Email campaigns**: Resend.com free tier (3k emails/month free, then $20/mo)

## Codebase structure

```
src/
  App.jsx              — Router + protected routes
  context/
    AuthContext.jsx    — Auth state, sign in/out, profile fetch
  lib/
    supabase.js        — Supabase client
  styles/
    globals.css        — Design system: tokens, components, utilities
  components/
    AppShell.jsx       — User app shell (bottom nav)
    AdminShell.jsx     — Admin shell (sidebar + topbar)
    ui/index.jsx       — Modal, Toast, ConfirmModal, Spinner
  pages/
    auth/Login.jsx
    auth/Signup.jsx
    user/Home.jsx      — Announcements, my classes, quick actions
    user/Classes.jsx   — Browse + toggle class enrollment
    user/Media.jsx     — Media grid + player
    user/Chat.jsx      — Iris chatbot
    user/Profile.jsx   — User info, sign out
    admin/Dashboard.jsx
    admin/Users.jsx    — User table + role management
    admin/Classes.jsx  — CRUD for classes
    admin/Announcements.jsx
    admin/Media.jsx    — CRUD + file upload to Supabase Storage
    admin/Settings.jsx — QR code, chatbot config, push structure
supabase/
  schema.sql           — Full DB schema + RLS + seed data
public/
  icons/               — App icons (add PNGs before deploying)
```

## Environment variables

| Variable | Where to find |
|---|---|
| `VITE_SUPABASE_URL` | Supabase dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API → anon public key |

Never commit `.env` to git. Add it to `.gitignore`.

## Maintenance (non-technical admin)

All content management is done through the admin dashboard at `/admin`:
- Add/edit/delete classes in the **Classes** section
- Post announcements in the **Announcements** section
- Upload videos and documents in the **Media** section
- Update Iris chatbot welcome message and chips in **Settings**
- Generate a new QR code in **Settings** if your URL changes
