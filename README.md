# Globe — Your digital world. Secured.

Version 1.0 of the Globe frontend: the landing page, interactive dotted 3D Earth,
registration/log-in interfaces, and a demo dashboard foundation.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** · **Tailwind CSS v4**
- **Three.js** · **React Three Fiber** · **Drei** for the globe
- **Lucide React** icons
- **Mona Sans** (GitHub) served locally from `public/fonts/mona-sans` under the SIL OFL 1.1 (`OFL.txt` included)

## Run locally

Requires Node.js 20.9+ (tested with Node 22 LTS).

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Type-check only: `npm run lint`.

## Deploy on Vercel

1. In Vercel, choose **Add New → Project** and import this GitHub repository.
2. Keep the detected defaults: framework **Next.js**, build command `next build`, no environment variables.
3. Click **Deploy**. Every push to `main` redeploys automatically, and pull requests get preview URLs.

The background music file isn't committed, because this repo is public and the track is licensed separately.
Without it, the site works normally and the music control stays hidden. See *Background music* below.

## Project structure

```
public/
  data/land-dots.bin        # generated land-dot dataset (≈23k dots, 91 KB)
  fonts/mona-sans/          # Mona Sans variable woff2 + OFL license
scripts/
  generate-land-dots.mjs    # rebuilds land-dots.bin from Natural Earth data
src/
  app/
    page.tsx                # landing page (hero, features, how it works, security)
    login/                  # log-in page
    dashboard/              # demo dashboard: overview, breaches, websites, activity, settings
    terms/ privacy/         # draft legal pages
    globals.css             # design tokens, @font-face, animations, reduced motion
  components/
    globe/
      Globe.tsx             # client wrapper: lazy-loads WebGL, fallbacks, controls, a11y
      GlobeCanvas.tsx       # <Canvas> (dynamically imported, ssr: false)
      GlobeScene.tsx        # Earth points, markers, camera rig (orbit, fly-to, reset)
      shaders.ts            # GLSL for dots, body shading and atmosphere
      StaticGlobe.tsx       # 2D-canvas fallback when WebGL is unavailable or fails
    auth/                   # RegisterForm, LoginForm, Field, Google glyph
    landing/                # Nav (incl. mobile menu), Hero, Sections, Footer
    dashboard/              # shell, cards, severity badges, settings panel
    ui/                     # Logo, Reveal (scroll animation)
  lib/
    demo-data.ts            # DEMO city-level figures for globe markers
    sample-dashboard.ts     # SAMPLE dashboard data (fictional)
    validation.ts           # email / password-strength / confirmation rules
    geo.ts hooks.ts ui.ts
```

## The globe

- Continents are built from ~23,000 points sampled on an equal-area grid and kept only if they fall on land
  in **Natural Earth 1:50m** polygons (public domain). Regenerate with `npm run generate:globe`.
- Rendered as a single `THREE.Points` draw call with a custom shader: view-space lighting, smaller and darker
  dots on the far side, limb softening. A dark shaded body sphere and a faint additive halo complete the look;
  a CSS radial glow sits behind the canvas.
- Interaction: drag to rotate, damped motion, scroll/pinch to zoom (wheel zoom activates after you press on the
  globe so page scrolling isn't hijacked), hover/click markers, previous/next location, zoom buttons, reset.
- Auto-rotation pauses during interaction or while a marker is hovered/selected and resumes ~2.5 s later.
- Camera distance auto-fits the canvas so proportions hold from phones to ultrawide screens.
- Performance: DPR capped at 1.75, the render loop stops when the globe is scrolled offscreen, the 3D bundle is
  lazy-loaded client-side, and data is a compact 91 KB binary.
- `prefers-reduced-motion`: no auto-rotation, static marker rings, instant camera moves, no entrance animations.
- No WebGL (or a runtime error) → static 2D orthographic render of the same data.

## Background music

A site-wide player (`src/components/audio/BackgroundMusic.tsx`, mounted in the root layout) plays
**"Sunrise" by Leadwave** on a loop with a mute control in the bottom-right corner.

- **Add the track:** put your licensed file at `public/audio/sunrise.mp3`. The control stays hidden until the file exists.
  The file is git-ignored, so it isn't published with this public repo. To ship it on Vercel, host it somewhere you're licensed to
  (or remove the ignore rule if your license allows public redistribution).
- Browsers block audible autoplay, so the music starts on the visitor's first click, tap or key press.
- The control mutes or unmutes with a short volume fade. The choice is saved in `localStorage` and remembered on return visits.
- Playback continues across page navigation.
- Only use music you have the rights to use on a commercial website.

## Demonstration-only features

| Area | Status in this version |
| --- | --- |
| Globe markers & "users protected" totals | **Fictional demo data**, aggregated by city, labeled "Demo" |
| Create Account | Client-side validation only. No request is sent, nothing is stored, passwords are cleared on submit. The success screen states that no account was created. |
| Log In / Forgot password / Continue with Google | Simulated; shows a notice that authentication isn't connected |
| Dashboard | Sample data only (fictional breach names, `example.com`), clearly labeled. Settings toggles are not saved. |
| Feature cards | Described as "Coming soon" — no breach lookups, scanning, or monitoring run |
| Terms / Privacy | Drafts, not legally binding |

No real penetration testing, breach lookups, or SIEM processing exists in this frontend.

## Future backend (planned)

Python · FastAPI · PostgreSQL. Suggested integration points:

- `RegisterForm` / `LoginForm` → replace the simulated delay with calls to an auth API (or an established
  provider). Hash passwords server-side with Argon2id; add MFA/passkeys; never log credentials.
- `lib/sample-dashboard.ts` → replace with typed API clients (`/api/overview`, `/api/breaches`, `/api/scans`).
- Breach monitoring → Have I Been Pwned API (email search) and Pwned Passwords range API (k-anonymity).
- Website assessments → gate all active checks behind domain-ownership verification (DNS TXT) and consent.
- SIEM → ingestion service + event store; feed aggregated, region-level counts into `<Globe locations=… />`.
