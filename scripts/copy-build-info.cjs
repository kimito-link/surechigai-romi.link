const fs = require('fs');
const path = require('path');

// server/_core/build-info.json を dist/build-info.json にコピー
const sourcePath = path.join(__dirname, '..', 'server', '_core', 'build-info.json');
const destPath = path.join(__dirname, '..', 'dist', 'build-info.json');

// distディレクトリが存在することを確認
const distDir = path.dirname(destPath);
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// ファイルをコピー
if (fs.existsSync(sourcePath)) {
  fs.copyFileSync(sourcePath, destPath);
  console.log(`Copied ${sourcePath} to ${destPath}`);
} else {
  console.error(`Source file not found: ${sourcePath}`);
  process.exit(1);
}
