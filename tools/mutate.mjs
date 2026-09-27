#!/usr/bin/env node
// 对门禁本身的 mutation test：在临时副本里逐条注入违规，断言 check.mjs 会报红。
// 任何一条「存活」（注入后仍全绿）都说明门禁有盲区。用法：node tools/mutate.mjs
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const root = join(dirname(new URL(import.meta.url).pathname), '..');
const edit = (file, from, to) => (dir) => {
  const p = join(dir, file); const s = readFileSync(p, 'utf8');
  if (!s.includes(from)) throw new Error(`变异没有命中：${file} ${from}`);
  writeFileSync(p, s.replace(from, to));
};
const firstGlossaryAnchor = () => {
  const s = readFileSync(join(root, 'glossary.html'), 'utf8');
  return s.match(/href="(chapters\/[^"]+#[^"]+)"/)[1];
};

const MUTATIONS = [
  ['删掉一个链接目标（章节文件）', (d) => unlinkSync(join(d, 'chapters', '3-2-birthday.html'))],
  ['改坏一个锚点', (d) => { const a = firstGlossaryAnchor(); edit('glossary.html', `href="${a}"`, `href="${a}-broken"`)(d); }],
  ['删掉一章对实验脚本的引用', edit('chapters/2-1-medical-test.html', '<script src="../assets/labs/2-1-medical-test.js"></script>', '')],
  ['删掉实验挂载点', edit('chapters/2-1-medical-test.html', 'id="grid"', 'id="grid-renamed"')],
  ['目录少链接一章（章节数不符）', edit('index.html', 'href="chapters/5-4-when-to-ignore.html"', 'href="#"')],
  ['多出一个未登记的章节文件', (d) => cpSync(join(d, 'chapters', '5-4-when-to-ignore.html'), join(d, 'chapters', '5-5-extra.html'))],
  ['样式表引用失效', edit('index.html', 'assets/handbook.css', 'assets/handbook-missing.css')],
];

let survived = 0;
for (const [name, mut] of MUTATIONS) {
  const dir = mkdtempSync(join(tmpdir(), 'prob-mut-'));
  for (const f of readdirSync(root)) if (!['.git', 'node_modules'].includes(f)) cpSync(join(root, f), join(dir, f), { recursive: true });
  mut(dir);
  const r = spawnSync(process.execPath, [join(root, 'tools', 'check.mjs'), dir], { encoding: 'utf8' });
  const killed = r.status !== 0;
  if (!killed) survived++;
  console.log(`${killed ? 'KILL ' : 'ALIVE'} ${name}${killed ? '  ← ' + (r.stdout.split('\n')[0] || '').slice(0, 70) : ''}`);
  rmSync(dir, { recursive: true, force: true });
}
console.log(`\n${MUTATIONS.length - survived}/${MUTATIONS.length} killed`);
process.exit(survived ? 1 : 0);
