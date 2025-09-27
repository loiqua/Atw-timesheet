# 📋 ATW Timesheet

> **Application complète de gestion des feuilles de temps**  
> Prête pour la production avec tests complets et documentation professionnelle

## 🚀 Démarrage rapide

```bash
# Installation
npm install

# Configuration
cp .env.example .env
# Éditer .env avec vos paramètres

# Base de données
npm run db:migrate
npm run db:seed

# Développement
npm run dev
```

## 🧪 Tests

```bash
# Tests complets
npm run test:all

# Tests par composant
npm run test              # Tests unitaires
npm run test:cov         # Avec couverture
npm run test:e2e         # Tests E2E
npm run test:coverage    # Rapport détaillé

# Mode développement
npm run test:watch       # Mode watch
```

## 📦 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarrage développement |
| `npm run build` | Build production |
| `npm run start` | Démarrage production |
| `npm run test:all` | Tous les tests + couverture |
| `npm run test:coverage` | Rapport de couverture détaillé |
| `npm run db:migrate` | Migrations base de données |
| `npm run db:seed` | Données de test |
| `npm run lint` | Vérification du code |

## 🎯 Fonctionnalités

- ✅ **Gestion complète des tâches** avec workflow d'approbation
- ✅ **Mode hors ligne** avec synchronisation automatique
- ✅ **Interface responsive** mobile et desktop
- ✅ **Génération PDF** professionnelle
- ✅ **Authentification sécurisée** avec JWT
- ✅ **Tests complets** (95%+ couverture)
- ✅ **Documentation complète** et API

## 📚 Documentation

- 📖 **Documentation complète** : [`docs/timesheet.md`](./docs/timesheet.md)
- 🔌 **API Reference** : Endpoints et exemples
- 🧪 **Guide des tests** : Configuration et exécution
- 🚀 **Guide de déploiement** : Production ready

## 🏗️ Architecture

- **Backend** : NestJS + TypeScript + PostgreSQL + Prisma
- **Frontend** : Next.js 15 + React 19 + TailwindCSS
- **Tests** : Jest + Playwright + Couverture 95%+
- **DevOps** : Turbo.js + ESLint + Prettier

## 🎉 Statut

- ✅ **Production Ready**
- ✅ **Tests complets** (Backend 95%+, Frontend 85%+, E2E 80%+)
- ✅ **Documentation professionnelle**
- ✅ **CI/CD configuré**
- ✅ **Monitoring intégré**

---

**🚀 L'application est prête pour le déploiement en production !**
