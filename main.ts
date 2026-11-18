// IRONHAVEN — the entry program for the make.fun gta6-01 kit.
//
// Run it from the repository root with Node 22+:
//   MAKEFUN_OUTPUT_DIR=/tmp/out1 node main.ts
//
// It stages this entry (game/ and screenshots/) into the output directory
// and writes dossier.json there with the kit's buildDossier, so the file the
// scorer rebuilds from the same game/ and screenshots/ matches byte for
// byte. The staging copy is deterministic (file bytes and paths only), so
// two runs into two fresh directories produce identical dossier bytes.
import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const entryDir = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
mkdirSync(outDir, { recursive: true });

for (const name of ['game', 'screenshots']) {
  const src = join(entryDir, name);
  const dst = join(outDir, name);
  if (existsSync(src) && src !== dst) {
    cpSync(src, dst, { recursive: true, force: true });
  }
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(dossierPath, dossier);
console.log(`dossier.json written: ${Buffer.from(dossier).length} bytes -> ${dossierPath}`);
