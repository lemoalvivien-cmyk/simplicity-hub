#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const IGNORE = new Set(["node_modules", ".git", "dist", "build", ".lovable", "public"]);
const IGNORE_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".woff", ".woff2", ".ttf", ".eot", ".pdf", ".zip"]);
const OUTPUT = "AUDIT_BRUT.md";

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE.has(entry.name)) walk(full, out);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (!IGNORE_EXT.has(ext)) {
        try {
          const content = fs.readFileSync(full, "utf8");
          out.push(`### ${full}\n\`\`\`\n${content}\n\`\`\`\n`);
        } catch (_) {}
      }
    }
  }
}

const chunks = [];
walk(".", chunks);
fs.writeFileSync(OUTPUT, chunks.join("\n"), "utf8");
console.log(`✅ AUDIT_BRUT.md généré — ${chunks.length} fichiers — ${(fs.statSync(OUTPUT).size / 1024).toFixed(0)} Ko`);
