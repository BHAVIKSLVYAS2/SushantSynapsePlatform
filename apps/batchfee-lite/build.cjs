const path = require('node:path');
const { buildSync } = require('esbuild');

function build() {
  buildSync({
    absWorkingDir: __dirname,
    entryPoints: ['backend/engine.js'],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'BatchFeeEngine',
    outfile: path.join(__dirname, 'frontend/engine.bundle.js'),
  });
}

if (require.main === module) build();
module.exports = { build };
