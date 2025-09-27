# Dashboard Components

Ce dossier contient tous les composants liés au dashboard professionnel de l'application ATW Timesheet.

## Structure

### Composants principaux
- `DashboardOverview.tsx` - Composant principal du dashboard avec toutes les statistiques
- `StatsCard.tsx` - Cartes de statistiques réutilisables
- `ProductivityChart.tsx` - Graphique de productivité avec Recharts
- `ProjectsOverview.tsx` - Vue d'ensemble des projets actifs
- `UserPerformanceTable.tsx` - Tableau de performance des utilisateurs (admin uniquement)

### Types et services
- `@/types/dashboard.ts` - Types TypeScript pour les données du dashboard
- `@/services/dashboard.service.ts` - Service API pour récupérer les données

## Fonctionnalités

### Statistiques affichées
- **Total des heures ce mois** - Heures travaillées dans le mois en cours
- **Tâches complétées** - Nombre de tâches terminées
- **Tâches en attente** - Nombre de tâches en cours
- **Projets actifs** - Nombre de projets en cours

### Graphiques
- **Graphique de productivité** - Tendances de productivité avec Recharts
- **Vue d'ensemble des projets** - Barres de progression des projets

### Permissions
- **Utilisateur standard** - Voit uniquement ses propres statistiques
- **Admin/Manager** - Peut voir les statistiques de tous les utilisateurs
- **Filtres** - Par période (semaine, mois, trimestre, année)
- **Export** - Possibilité d'exporter les données en Excel

## Technologies utilisées
- React 19 avec TypeScript
- Recharts pour les graphiques
- Radix UI pour les composants
- TailwindCSS pour le styling
- React Query pour la gestion des données
- Zustand pour l'état global

## Usage

```tsx
import { DashboardOverview } from '@/components/dashboard';

export default function DashboardPage() {
  return <DashboardOverview />;
}
```
