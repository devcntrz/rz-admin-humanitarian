const fs = require('fs');
const path = require('path');

function copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const items = fs.readdirSync(src);
    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        const stats = fs.statSync(srcPath);
        if (stats.isDirectory()) {
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

// Clear and create dist directory
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy standalone files to dist
copyRecursive(path.join(rootDir, '.next/standalone'), distDir);
copyRecursive(path.join(rootDir, '.next/static'), path.join(distDir, '.next/static'));
copyRecursive(path.join(rootDir, 'public'), path.join(distDir, 'public'));

console.log('✓ Successfully created standalone build in dist folder');
