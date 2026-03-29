import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { pipeline } from 'stream/promises';

const enabled = /^(1|true|yes)$/i.test(process.env.INSTALL_FAIRY_STOCKFISH ?? '');
const downloadUrl = process.env.FAIRY_STOCKFISH_DOWNLOAD_URL
  ?? 'https://github.com/fairy-stockfish/Fairy-Stockfish-NNUE/releases/download/makruk-23def9767554/fairy-stockfish_x86-64-modern';
const outputPath = path.resolve(
  process.cwd(),
  process.env.FAIRY_STOCKFISH_BINARY_PATH?.trim() || './bin/fairy-stockfish-makruk',
);

if (!enabled) {
  console.log('[fairy-stockfish] INSTALL_FAIRY_STOCKFISH is not enabled, skipping binary download.');
  process.exit(0);
}

await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

async function download(url, destination, redirectCount = 0) {
  if (redirectCount > 5) {
    throw new Error('Too many redirects while downloading Fairy-Stockfish.');
  }

  const client = url.startsWith('https:') ? https : http;

  await new Promise((resolve, reject) => {
    const request = client.get(url, (response) => {
      const location = response.headers.location;
      if (location && response.statusCode && response.statusCode >= 300 && response.statusCode < 400) {
        response.resume();
        resolve(download(new URL(location, url).toString(), destination, redirectCount + 1));
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Unexpected download status ${response.statusCode ?? 'unknown'}.`));
        return;
      }

      const output = fs.createWriteStream(destination);
      pipeline(response, output).then(resolve).catch(reject);
    });

    request.on('error', reject);
  });
}

console.log(`[fairy-stockfish] Downloading binary to ${outputPath}`);
await download(downloadUrl, outputPath);
await fs.promises.chmod(outputPath, 0o755);
console.log('[fairy-stockfish] Binary ready.');
