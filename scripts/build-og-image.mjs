#!/usr/bin/env node
/** Generates public/og-image.png (1200×630) — the default social share card. */
import sharp from "sharp";
import { readFileSync } from "node:fs";

const logo = readFileSync(
	new URL("../src/assets/dtss-logo.png", import.meta.url)
).toString("base64");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0f9ff"/><stop offset="0.55" stop-color="#ffffff"/><stop offset="1" stop-color="#dbeefa"/></linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a93d1"/><stop offset="1" stop-color="#0d968b"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1080" cy="80" r="260" fill="#2a93d1" opacity="0.08"/>
  <circle cx="1150" cy="560" r="200" fill="#0d968b" opacity="0.08"/>
  <image href="data:image/png;base64,${logo}" x="80" y="70" width="260" height="120"/>
  <text x="80" y="330" font-family="Nunito, Helvetica, Arial, sans-serif" font-size="68" font-weight="800" fill="#020817">It's a whole new</text>
  <text x="80" y="410" font-family="Nunito, Helvetica, Arial, sans-serif" font-size="68" font-weight="800" fill="#2a93d1">staffing experience.</text>
  <text x="80" y="480" font-family="Nunito, Helvetica, Arial, sans-serif" font-size="30" fill="#475569">Dental temp &amp; permanent staffing · Hygienists · Assistants · Front office</text>
  <rect x="0" y="590" width="1200" height="40" fill="url(#bar)"/>
  <text x="80" y="618" font-family="Nunito, Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff">dtstaffingsolutions.com</text>
</svg>`;
await sharp(Buffer.from(svg))
	.png()
	.toFile(new URL("../public/og-image.png", import.meta.url).pathname);
console.log("public/og-image.png written");
