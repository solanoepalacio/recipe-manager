---
date: "2026-05-14 21:00"
promoted: false
---

Tech debt: `images: { unoptimized: true }` was set in next.config.ts to work around Next.js 15's image optimizer failing to fetch /uploads/* via its internal loopback in Docker. The direct Caddy→API path works fine, but the optimizer's internal loopback fetch does not. To restore optimization (WebP conversion, responsive sizing), a proper fix would be needed — e.g. a custom Next.js image loader that references the public Caddy URL, or a CDN/object-storage layer for uploaded images. Low priority for a recipe app with small images.
