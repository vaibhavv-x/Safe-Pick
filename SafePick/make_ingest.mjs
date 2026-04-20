#!/usr/bin/env node
/**
 * Builds digest.txt: directory tree + source/config contents for AI planning.
 * Skips node_modules, build output, lockfiles, and package dependency listings.
 *
 * Usage: node make_ingest.mjs [output_path]
 * Default output: ./digest.txt (next to this script)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

const OUT = path.resolve(process.argv[2] ?? path.join(ROOT, "digest.txt"));

/** Directory names to skip entirely */
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "out",
  "dist",
  "build",
  "coverage",
  ".turbo",
  ".vercel",
  ".cache",
  "__pycache__",
  ".idea",
  ".vscode",
]);

/** Files to skip (by basename) */
const SKIP_FILES = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  ".DS_Store",
  "digest.txt",
  "Thumbs.db",
]);

/** Extensions we treat as text and embed */
const TEXT_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".html",
  ".htm",
  ".md",
  ".mdx",
  ".json",
  ".yml",
  ".yaml",
  ".toml",
  ".xml",
  ".svg",
  ".env.example",
  ".gitignore",
  ".editorconfig",
]);

const BINARY_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".otf",
  ".pdf",
  ".zip",
  ".mp4",
  ".webm",
  ".mp3",
]);

const MAX_FILE_BYTES = 512 * 1024;

function rel(from, to) {
  return path.relative(from, to).split(path.sep).join("/") || ".";
}

async function treeLines(dir, prefix = "", base = ROOT, lines = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return lines;
  }
  const sorted = entries.sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (let i = 0; i < sorted.length; i++) {
    const ent = sorted[i];
    const name = ent.name;
    const full = path.join(dir, name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(name)) {
        lines.push(`${prefix}${i === sorted.length - 1 ? "└── " : "├── "}${name}/ [skipped]`);
        continue;
      }
      lines.push(`${prefix}${i === sorted.length - 1 ? "└── " : "├── "}${name}/`);
      const nextPrefix = prefix + (i === sorted.length - 1 ? "    " : "│   ");
      await treeLines(full, nextPrefix, base, lines);
    } else {
      if (SKIP_FILES.has(name)) continue;
      const ext = path.extname(name).toLowerCase();
      const isBin = BINARY_EXT.has(ext);
      const tag = isBin ? " [binary]" : "";
      lines.push(`${prefix}${i === sorted.length - 1 ? "└── " : "├── "}${name}${tag}`);
    }
  }
  return lines;
}

function isTextFile(filePath, basename) {
  if (basename === ".env" || basename.startsWith(".env.") && basename !== ".env.example")
    return false;
  const ext = path.extname(basename).toLowerCase();
  if (TEXT_EXT.has(ext)) return true;
  if (!ext && basename === "Dockerfile") return true;
  if (!ext && basename.startsWith("LICENSE")) return true;
  return false;
}

async function collectFiles(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      await collectFiles(full, out);
    } else {
      if (SKIP_FILES.has(ent.name)) continue;
      out.push(full);
    }
  }
  return out;
}

function slimPackageJson(raw) {
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  const slim = {
    name: obj.name,
    version: obj.version,
    private: obj.private,
    scripts: obj.scripts,
    engines: obj.engines,
  };
  return JSON.stringify(slim, null, 2);
}

async function readFileSection(absPath) {
  const basename = path.basename(absPath);
  if (basename === "package.json") {
    const raw = await fs.readFile(absPath, "utf8");
    const slim = slimPackageJson(raw);
    return slim ?? raw;
  }
  const stat = await fs.stat(absPath);
  if (stat.size > MAX_FILE_BYTES) {
    return `/* [truncated in digest: file larger than ${MAX_FILE_BYTES} bytes] */\n`;
  }
  return await fs.readFile(absPath, "utf8");
}

async function main() {
  const tree = await treeLines(ROOT, "", ROOT, []);
  const allFiles = await collectFiles(ROOT);
  const textFiles = [];
  for (const abs of allFiles.sort((a, b) => rel(ROOT, a).localeCompare(rel(ROOT, b)))) {
    const bn = path.basename(abs);
    const ext = path.extname(bn).toLowerCase();
    if (BINARY_EXT.has(ext)) continue;
    if (!isTextFile(abs, bn) && bn !== "package.json") continue;
    textFiles.push(abs);
  }

  const header = [
    "=".repeat(80),
    "CODEBASE DIGEST (for planning / AI context)",
    `Generated: ${new Date().toISOString()}`,
    `Root: ${ROOT}`,
    "",
    "Excluded: node_modules, .next, dist, build, lockfiles, env secrets, binaries.",
    "package.json is included as slim JSON (name, version, scripts only — no dependency lists).",
    "=".repeat(80),
    "",
    "--- DIRECTORY TREE ---",
    rel(ROOT, ROOT) + "/",
    ...tree,
    "",
    "--- FILE CONTENTS ---",
    "",
  ].join("\n");

  const chunks = [header];
  for (const abs of textFiles) {
    const r = rel(ROOT, abs);
    let body;
    try {
      body = await readFileSection(abs);
    } catch (e) {
      body = `/* [could not read: ${e.message}] */\n`;
    }
    chunks.push("=".repeat(80));
    chunks.push(`FILE: ${r}`);
    chunks.push("=".repeat(80));
    chunks.push(body);
    if (!body.endsWith("\n")) chunks.push("");
    chunks.push("");
  }

  await fs.writeFile(OUT, chunks.join("\n"), "utf8");
  console.log(`Wrote ${OUT} (${textFiles.length} files)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
