#!/usr/bin/env node
'use strict';

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

// All status output goes to stderr so stdout stays clean for PNG bytes
const log  = (...a) => process.stderr.write(a.join(' ') + '\n');
const fail = (msg)  => { log('❌  Error:', msg); process.exit(1); };

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flags = {};
const positional = [];

for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
        const [key, val] = args[i].slice(2).split('=');
        flags[key] = val ?? args[++i] ?? true;
    } else {
        positional.push(args[i]);
    }
}

const inputFile = positional[0];
const style     = flags.style  || process.env.WIREMD_STYLE  || 'sketch';
const width     = parseInt(flags.width  || process.env.WIREMD_WIDTH  || '0', 10);
const height    = parseInt(flags.height || process.env.WIREMD_HEIGHT || '0',  10);

// ─── Help ────────────────────────────────────────────────────────────────────
if (!inputFile || flags.help) {
    process.stderr.write(`
wiremd-png — Render a WireMD (.md) file to PNG

Usage:
  # Output to file (redirect stdout)
  render /data/mockup.md > /data/mockup.png

  # Pipe directly
  render /data/mockup.md --style=clean --width=1440 > out.png

Options:
  --style=<s>   Visual style: sketch|clean|wireframe|tailwind|material|brutal
  --width=<px>  Viewport width  (default: 0)
  --height=<px> Viewport height (default: 0)
  --help        Show this help
`);
    process.exit(inputFile ? 0 : 1);
}

// ─── Validate input ───────────────────────────────────────────────────────────
const absInput = path.resolve(inputFile);
if (!fs.existsSync(absInput)) fail(`input file not found: ${absInput}`);

log(`📄  Input  : ${absInput}`);
log(`🎨  Style  : ${style}`);
log(`📐  Size   : ${width}×${height}`);
log('');

// ─── Render HTML via wiremd CLI ───────────────────────────────────────────────
async function renderAndScreenshot(mdPath, styleName, vpWidth, vpHeight) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wiremd-'));
    try {
        const srcDir = path.dirname(mdPath);
        const baseName = path.basename(mdPath);
        const tmpMd = path.join(tmpDir, baseName);

        // Copy everything from the input file's directory to the temp dir
        // This allows relative images/assets to be found during build and render
        fs.cpSync(srcDir, tmpDir, { recursive: true });

        const styleArg = styleName !== 'sketch' ? ` --style ${styleName}` : '';
        const tmpHtml = path.join(tmpDir, 'output.html');

        try {
            execSync(`wiremd "${tmpMd}"${styleArg} --output "${tmpHtml}"`, { cwd: tmpDir, stdio: 'pipe' });
        } catch (_) {
            execSync(`wiremd "${tmpMd}"${styleArg}`, { cwd: tmpDir, stdio: 'pipe' });
        }

        const candidates = [
            tmpHtml,
            path.join(tmpDir, 'dist', baseName.replace(/\.md$/i, '.html')),
            path.join(tmpDir, 'dist', 'output.html'),
        ];
        let htmlFile = candidates.find(f => fs.existsSync(f));
        if (!htmlFile) htmlFile = walkFind(tmpDir, f => f.endsWith('.html'));
        if (!htmlFile) throw new Error('wiremd produced no HTML — check the input file.');

        // Take screenshot using the HTML file in the temp directory so Puppeteer can resolve local assets
        await screenshot(htmlFile, vpWidth, vpHeight);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

function walkFind(dir, predicate) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { const h = walkFind(full, predicate); if (h) return h; }
        else if (predicate(entry.name)) return full;
    }
    return null;
}

// ─── Screenshot via Puppeteer → stdout ───────────────────────────────────────
async function screenshot(htmlFile, vpWidth, vpHeight) {
    const tmpPng  = path.join(os.tmpdir(), `wiremd-${Date.now()}.png`);

    const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        headless: true,
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: vpWidth, height: vpHeight });
        await page.goto(`file://${htmlFile}`, { waitUntil: 'networkidle0', timeout: 30_000 });
        await new Promise(r => setTimeout(r, 300));
        await page.screenshot({ path: tmpPng, fullPage: true });
    } finally {
        await browser.close();
    }

    // Write PNG bytes to stdout, then clean up
    const buf = fs.readFileSync(tmpPng);
    process.stdout.write(buf);
    fs.rmSync(tmpPng, { force: true });

    const kb = (buf.length / 1024).toFixed(1);
    log(`✅  Done! (${kb} KB) — pipe or redirect stdout to save the PNG`);
}

// ─── Main ────────────────────────────────────────────────────────────────────
(async () => {
    log('⏳  Rendering HTML and capturing PNG …');
    await renderAndScreenshot(absInput, style, width, height);
})().catch(err => fail(err.message));