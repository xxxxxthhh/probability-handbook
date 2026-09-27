#!/usr/bin/env node
// 程序化门禁（最小版）：发布页的内部链接与锚点、资源引用、目录章节数、交互实验挂载。
// 用法：node tools/check.mjs [ROOT]    退出码 0 = 全绿，1 = 有错误
// 改动本文件后必须跑 node tools/mutate.mjs（QUALITY.md 第 3 条）。
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const root = resolve(process.argv[2] || join(dirname(new URL(import.meta.url).pathname), '..'));
const errors = [];
const E = (m) => errors.push(m);

const chapterFiles = readdirSync(join(root, 'chapters')).filter((f) => f.endsWith('.html')).sort();
const pages = ['index.html', 'glossary.html', 'firstaid.html', ...chapterFiles.map((f) => `chapters/${f}`)];
const html = Object.fromEntries(pages.map((p) => [p, readFileSync(join(root, p), 'utf8')]));
const idsOf = (s) => new Set([...s.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const ids = Object.fromEntries(pages.map((p) => [p, idsOf(html[p])]));

// 1. 内部链接、锚点与资源引用
for (const p of pages) {
  for (const [, attr, raw] of html[p].matchAll(/\s(href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:|javascript:)/.test(raw) || raw.startsWith('//')) continue;
    const [path, hash] = raw.split('#');
    const target = path ? join(dirname(p), path) : p;
    if (path && !existsSync(join(root, target))) { E(`${p}: ${attr} 指向不存在的文件 ${raw}`); continue; }
    if (hash && target.endsWith('.html')) {
      const t = ids[target] ?? idsOf(readFileSync(join(root, target), 'utf8'));
      if (!t.has(hash)) E(`${p}: 锚点不存在 ${raw}`);
    }
  }
}

// 2. 目录页章节数 == chapters/ 实际文件数，且每章都被目录链接
const linked = new Set([...html['index.html'].matchAll(/href="chapters\/([^"#]+\.html)/g)].map((m) => m[1]));
if (linked.size !== chapterFiles.length) E(`index.html: 目录链接 ${linked.size} 章，chapters/ 实有 ${chapterFiles.length} 章`);
for (const f of chapterFiles) if (!linked.has(f)) E(`index.html: 目录缺少 chapters/${f}`);

// 3. 交互实验：每章引用自己的 lab 脚本，脚本存在，脚本按 id 取的挂载点都在页面里
for (const f of chapterFiles) {
  const p = `chapters/${f}`;
  const lab = `labs/${f.replace(/\.html$/, '.js')}`;
  if (!html[p].includes(`../assets/${lab}`)) { E(`${p}: 没有引用本章实验脚本 assets/${lab}`); continue; }
  const js = readFileSync(join(root, 'assets', lab), 'utf8');
  const used = new Set([...js.matchAll(/getElementById\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1]));
  for (const id of used) if (!ids[p].has(id)) E(`${p}: 实验脚本取用的挂载点 #${id} 在页面里不存在`);
  if (!/<section id="lab"/.test(html[p])) E(`${p}: 缺少交互实验段 <section id="lab">`);
}

for (const e of errors) console.log(`ERROR ${e}`);
console.log(`${errors.length} error(s) · ${pages.length} 页 · ${chapterFiles.length} 章`);
process.exit(errors.length ? 1 : 0);
