# fwends.co

The public website for FWENDS, built and operated by Fwends LLC. Plain HTML, CSS and
JavaScript, no build step, served by GitHub Pages from the root of `main`.

```
index.html            home: what FWENDS is, how it works, why, about, contact, waitlist
support/index.html    support and FAQ  → https://fwends.co/support/
privacy/index.html    Privacy Policy   → https://fwends.co/privacy/
terms/index.html      Terms of Service → https://fwends.co/terms/
404.html              not-found page
assets/css/site.css   every style, built on the FWENDS design tokens
assets/js/site.js     mobile menu, scroll reveals, the hero's dot-matrix scene
assets/fonts/         Elms Sans and Bitcount Single (SIL OFL), subset to Latin, woff2
assets/wordmark.svg   the fwends wordmark: Bitcount Single's dot grid as circles
assets/og.png         link-preview image
scripts/              stamp-assets.sh: cache-busts the CSS and JS links
```

Links are root-absolute (`/privacy/`), so the site must be served from a domain root:
`fwends-co.github.io` or the custom domain `fwends.co`.

The header and footer are repeated in each page. When you change one, change all five.

After editing `assets/css/site.css` or `assets/js/site.js`, run:

```bash
./scripts/stamp-assets.sh
```

It points every page at the new file by content hash (`site.css?v=…`). GitHub Pages
lets browsers cache assets for 10 minutes, so without it a visitor can get the new
HTML with the old stylesheet.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Before Apple enrollment

- Replace `[ADDRESS TO BE PROVIDED]` and `[PHONE TO BE PROVIDED]` in `index.html`
  (search for `TODO`). The address must match the D-U-N-S record.
- `privacy/` and `terms/` are drafts and need legal review before the app launches.
  This is noted in an HTML comment at the top of each file.

## Custom domain: fwends.co

The domain's DNS is at GoDaddy. In GoDaddy DNS for `fwends.co`:

| Type  | Name | Value                  |
|-------|------|------------------------|
| A     | @    | 185.199.108.153        |
| A     | @    | 185.199.109.153        |
| A     | @    | 185.199.110.153        |
| A     | @    | 185.199.111.153        |
| CNAME | www  | fwends-co.github.io    |

Delete any other `A` records on `@`, and turn off domain forwarding or parking. Then, in
this repo's Settings → Pages, set the custom domain to `fwends.co` (which commits a
`CNAME` file) and tick **Enforce HTTPS** once the certificate is issued.
