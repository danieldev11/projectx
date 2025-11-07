# ProjectX Frontend

Astro + Tailwind landing page used for lead intake. Form submissions post to the Cloudflare Worker proxy (`/lead`), which validates and forwards to n8n.

## Commands

All commands run from `frontend/`:

| Command           | Description                                |
| ----------------- | ------------------------------------------ |
| `npm install`     | Install dependencies                       |
| `npm run dev`     | Start Astro dev server on http://localhost:4321 |
| `npm run build`   | Create production build in `dist/`         |
| `npm run preview` | Preview the build locally                  |

Set `PUBLIC_LEAD_ENDPOINT` in `.env` to the Worker URL. Local development defaults to `http://127.0.0.1:8787/lead` (Wrangler dev server).

## Structure

```
frontend/
|- public/              # Static assets (favicon, robots, etc.)
|- src/
|  |- components/      # Hero, lead form, sections
|  |- layouts/         # Base layout with global chrome
|  |- pages/           # Astro routes (index.astro)
|  |- styles/          # Tailwind global stylesheet
|- tailwind.config.mjs  # Design tokens and plugins
|- astro.config.mjs     # Astro + Tailwind integration
```

The design system uses custom brand colors aimed at service contractors. Update `tailwind.config.mjs` to tweak fonts, spacing, or shadows.
