# Malzx Official — Portfolio

Static HTML/CSS/JavaScript portfolio for Hikmal Apriansyah.

## Files
- `index.html` — main website
- `assets/og-preview.svg` — social preview image used by Open Graph metadata
- `assets/favicon.svg` — browser tab icon
- `assets/profile.jpg` — add your own profile photo here (not included)

## Add your profile photo
Upload a square or portrait image named `profile.jpg` into `assets/`.
The website will display it in a circular frame. If it is missing, the initials `HA` appear instead.

## Deploy to Vercel
1. Upload these files to a GitHub repository, keeping the folder structure.
2. In Vercel, import that repository as a project.
3. Framework Preset: `Other`; Build Command: leave empty; Output Directory: `.` (or leave the default for a static site).
4. Deploy.
5. In Vercel project Settings → Domains, add `malzx-official.my.id` and follow the exact DNS records Vercel provides.
6. If you also want `www.malzx-official.my.id`, add that domain separately and follow Vercel's DNS instructions.

## WhatsApp link preview
The page includes Open Graph title, description, URL, and image metadata. The preview uses a 1200×630 PNG at `https://malzx-official.my.id/assets/og-preview.png`, which is generally more compatible with social preview crawlers than SVG. WhatsApp can cache previews, so it may not update immediately. A real personal photo is not included in the social preview; it uses the `HA` initials.
