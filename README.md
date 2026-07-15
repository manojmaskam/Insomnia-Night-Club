# Insomnia Night Club

Marketing website for **Insomnia Night Club** — a bar & nightclub in Khajaguda,
Hyderabad. A fast, fully **static** site (HTML/CSS/JS) with a pixel-faithful,
dark-and-gold design, built from a Figma reference.

🔗 Live: **https://insomnianightclub.net**

---

## ✨ Features

- **Pixel-perfect, responsive** layout — desktop, tablet, and mobile breakpoints
  (the design scales proportionally with the viewport).
- **Smooth scrolling & motion** — [Lenis](https://github.com/darkroomengineering/lenis)
  + [GSAP](https://gsap.com/) / ScrollTrigger (glitch intro, reveals, parallax,
  auto-scrolling marquees).
- **Dynamic events, no backend** — the Upcoming Events on the homepage and the
  Events page render from a data file (**CSV**, editable in Excel). Past events
  drop off automatically; if none are upcoming, the most recent past event stays
  visible.
- **SEO-ready** — semantic `<h1>`, meta + keywords, Open Graph / Twitter cards,
  geo tags, `NightClub`/`BarOrPub` JSON-LD structured data, `sitemap.xml`,
  `robots.txt`.
- **Integrations** — Google Maps embed (Find Us), District table-booking links,
  social links.

---

## 🗂️ Project structure

```
.
├── index.html                 # Homepage
├── events.html                # Upcoming events page
├── css/
│   └── style.css              # All styles (single stylesheet)
├── js/
│   ├── main.js                # Lenis + GSAP motion, nav, marquees
│   └── events-render.js       # Reads data/events.csv → renders event cards
├── data/
│   ├── events.csv             # ← EDIT THIS to manage events (Excel-friendly)
│   ├── events.json            # Fallback if the CSV is missing
│   └── HOW-TO-EDIT-EVENTS.txt  # Event-editing guide
├── assets/
│   ├── images/                # Photos, logos, baked service/gallery images
│   └── svg/                   # Icons, script headings, wordmark
├── .htaccess                  # gzip, caching, security headers, HTTPS-ready
├── robots.txt
├── sitemap.xml
└── DEPLOY-TO-HOSTINGER.md     # Deployment steps
```

---

## 🖥️ Local preview

It's a static site, so any static server works (the Google Map and CSV `fetch`
need `http://`, not `file://`):

```bash
# Python
python -m http.server 8000

# Node
npx serve .
```

Then open `http://localhost:8000`.

---

## 📅 Managing events (Excel / CSV)

Events are driven by **`data/events.csv`** — no admin panel, no database.

1. Open `data/events.csv` in Excel / Google Sheets.
2. Keep the header row: `name, date, time, image`
3. Add one row per event:

   | name     | date       | time | image                        |
   |----------|------------|------|------------------------------|
   | DJ Leena | 2026-08-01 | 8 PM | assets/images/dj_card.jpg    |

4. **Save As → CSV**, keep the name `events.csv`, and upload it to `data/`.

- `date`: best as `YYYY-MM-DD` (also accepts `DD/MM/YYYY` or `1 Aug 2026`);
  the weekday is computed automatically.
- `image`: any path under `assets/` — upload posters to `assets/images/`.
- Details in [`data/HOW-TO-EDIT-EVENTS.txt`](data/HOW-TO-EDIT-EVENTS.txt).

---

## 🚀 Deployment (Hostinger)

Static hosting — just upload the files to `public_html`. Full steps in
[`DEPLOY-TO-HOSTINGER.md`](DEPLOY-TO-HOSTINGER.md).

1. Upload the site to `public_html` (File Manager or SFTP).
2. Enable **free SSL**, then uncomment the "Force HTTPS" block in `.htaccess`.
3. Manage events via `data/events.csv`.

---

## 🛠️ Tech stack

- HTML5, CSS3 (single stylesheet, custom properties, `vw`-based scaling)
- Vanilla JavaScript (no framework/build step)
- GSAP + ScrollTrigger, Lenis (via CDN)
- Google Fonts: Lato, Anton (via CDN)

No build tooling required — edit and ship.

---

## 📄 License

© Insomnia Night Club. All rights reserved.
