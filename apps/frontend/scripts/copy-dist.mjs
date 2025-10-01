import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextDir = path.join(__dirname, '../.next');
const destDir = path.join(__dirname, '../dist');

console.log('📦 Copie des fichiers de build vers dist/...');

// Créer le dossier dist s'il n'existe pas
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Vider le dossier dist
fs.emptyDirSync(destDir);

// Copier index.html depuis .next/server/app/
const indexSource = path.join(nextDir, 'server/app/index.html');
const indexDest = path.join(destDir, 'index.html');

if (fs.existsSync(indexSource)) {
  fs.copySync(indexSource, indexDest);
  console.log('✅ index.html copié');
} else {
  console.error('❌ index.html introuvable dans .next/server/app/');
  process.exit(1);
}

// Copier tous les fichiers HTML et assets depuis .next/server/app/
const serverAppSource = path.join(nextDir, 'server/app');
if (fs.existsSync(serverAppSource)) {
  const files = fs.readdirSync(serverAppSource);
  files.forEach(file => {
    const sourcePath = path.join(serverAppSource, file);
    const destPath = path.join(destDir, file);
    
    // Copier les fichiers HTML et les dossiers
    if (file.endsWith('.html') || fs.statSync(sourcePath).isDirectory()) {
      fs.copySync(sourcePath, destPath, { overwrite: true });
    }
  });
  console.log('✅ Fichiers HTML copiés');
}

// Copier le dossier static
const staticSource = path.join(nextDir, 'static');
const staticDest = path.join(destDir, '_next/static');

if (fs.existsSync(staticSource)) {
  fs.ensureDirSync(path.dirname(staticDest));
  fs.copySync(staticSource, staticDest, { overwrite: true });
  console.log('✅ Fichiers static copiés vers _next/static');
} else {
  console.warn('⚠️  Dossier static introuvable');
}

// Copier le dossier public
const publicSource = path.join(__dirname, '../public');
if (fs.existsSync(publicSource)) {
  const publicFiles = fs.readdirSync(publicSource);
  publicFiles.forEach(file => {
    const sourcePath = path.join(publicSource, file);
    const destPath = path.join(destDir, file);
    fs.copySync(sourcePath, destPath, { overwrite: true });
  });
  console.log('✅ Fichiers public copiés');
}

console.log('✅ Tous les fichiers ont été copiés vers dist/');
