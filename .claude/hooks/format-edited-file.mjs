#!/usr/bin/env node
// PostToolUse hook: formats the file Claude just wrote with the repo's local prettier.
// Reads the hook payload as JSON on stdin. Always exits 0 — a formatting problem
// must never block an edit that already succeeded.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const prettierBin = resolve(projectRoot, 'node_modules', 'prettier', 'bin', 'prettier.cjs');

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
    let filePath;
    try {
        const payload = JSON.parse(raw);
        filePath = payload?.tool_response?.filePath ?? payload?.tool_input?.file_path;
    } catch {
        process.exit(0); // malformed payload — nothing to format
    }

    if (!filePath || !existsSync(prettierBin)) process.exit(0);

    const target = resolve(filePath);
    if (!existsSync(target)) process.exit(0);

    // Stay inside the repo: never reformat scratchpad or unrelated files.
    const rel = relative(projectRoot, target);
    if (rel.startsWith('..') || resolve(projectRoot, rel) !== target) process.exit(0);

    // --ignore-unknown skips extensions prettier has no parser for;
    // .prettierignore keeps dist/, .angular/, and package-lock.json out.
    const result = spawnSync(process.execPath, [prettierBin, '--write', '--ignore-unknown', target], {
        cwd: projectRoot,
        encoding: 'utf8',
    });

    if (result.status !== 0 && result.stderr?.trim()) {
        // Surface real failures (a syntax error prettier can't parse) without blocking.
        console.log(
            JSON.stringify({
                systemMessage: `prettier could not format ${rel}: ${result.stderr.trim().split('\n')[0]}`,
            }),
        );
    }
    process.exit(0);
});
