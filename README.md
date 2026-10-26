# Bernie Creator Studio

Private planning and growth studio for Bernie Brice's TikTok (Instagram coming), built from Meredith TikTok Studio: same tools, his own data, passcode and site.

- Data comes from the read-only n8n webhook `bcs-studio-data`, unlocked with Bernie's passcode (n8n Header Auth credential "Bernie Studio Passcode", header `X-Studio-Key`). No passcode, key or token lives in this repo.
- n8n workflows live in the "Bernie Creator Studio" folder and use the BCS data tables.
- TikTok access is read-only (Login Kit + Display API). Bernie posts in the TikTok app himself.
- Build: `npm run build` → `netlify-dist`. Public pages: `/links/` (link in bio), `/kit/` (media kit), `/privacy/`, `/terms/`.
