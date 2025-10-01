import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '../.next/standalone');
const destDir = path.join(__dirname, '../dist');

console.log('📦 Copie des fichiers de build vers dist/...');

// Créer le dossier dist s'il n'existe pas
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Vider le dossier dist
fs.emptyDirSync(destDir);

// Copier les fichiers standalone
if (fs.existsSync(sourceDir)) {
  fs.copySync(sourceDir, destDir, { overwrite: true });
  console.log('✅ Fichiers standalone copiés');
} else {
  console.warn('⚠️  Dossier standalone introuvable');
}

// Copier le dossier static
const staticSource = path.join(__dirname, '../.next/static');
const staticDest = path.join(destDir, '.next/static');

if (fs.existsSync(staticSource)) {
  fs.ensureDirSync(path.dirname(staticDest));
  fs.copySync(staticSource, staticDest, { overwrite: true });
  console.log('✅ Fichiers static copiés');
} else {
  console.warn('⚠️  Dossier static introuvable');
}

// Copier le dossier public si nécessaire
const publicSource = path.join(__dirname, '../public');
const publicDest = path.join(destDir, 'public');

if (fs.existsSync(publicSource)) {
  fs.copySync(publicSource, publicDest, { overwrite: true });
  console.log('✅ Fichiers public copiés');
}

console.log('✅ Tous les fichiers ont été copiés vers dist/');
