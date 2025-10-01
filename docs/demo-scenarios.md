# 🎬 Scénarios de Démonstration - ATW Timesheet

## 📋 Table des matières
1. [Configuration initiale](#configuration-initiale)
2. [Scénario 1 : Flux employé complet](#scénario-1--flux-employé-complet)
3. [Scénario 2 : Validation manager](#scénario-2--validation-manager)
4. [Scénario 3 : Administration](#scénario-3--administration)
5. [Scénario 4 : Réinitialisation mot de passe](#scénario-4--réinitialisation-mot-de-passe)
6. [Données de test](#données-de-test)

---

## Configuration initiale

### Prérequis
- Docker et Docker Compose installés
- Ports 3000, 8000 et 5432 disponibles

### Lancement de la démo
```bash
# Méthode 1 : Script automatique
./scripts/demo-setup.sh

# Méthode 2 : Manuelle
docker-compose down
docker-compose up -d
docker-compose exec api npx tsx prisma/seed-demo.ts
```

### Accès
- **Frontend** : http://localhost:3000
- **API** : http://localhost:8000
- **Swagger** : http://localhost:8000/api

---

## Scénario 1 : Flux employé complet

### 🎯 Objectif
Démontrer le cycle de vie complet d'une tâche du point de vue d'un employé.

### 👤 Utilisateur
**Sophie Bernard** - Enquêtrice  
📧 `sophie.bernard@atw.com` / 🔑 `demo123`

### 📝 Étapes

#### 1. Connexion
1. Aller sur http://localhost:3000
2. Se connecter avec les identifiants de Sophie
3. **Résultat attendu** : Dashboard avec les tâches de Sophie

#### 2. Consultation du calendrier
1. Cliquer sur "Calendrier" dans le menu
2. Observer les créneaux de la semaine
3. **Résultat attendu** : 
   - Tâche "Enquête satisfaction client" (8h-12h) - APPROVED ✅
   - Tâche "Saisie et analyse" (13h-17h) - SUBMITTED 🔵

#### 3. Création d'une nouvelle tâche
1. Cliquer sur "Timesheet" > "Nouvelle tâche"
2. Remplir le formulaire :
   - **Titre** : "Rapport hebdomadaire d'activité"
   - **Description** : "Compilation des résultats de la semaine et recommandations"
   - **Domaine** : Enquêteurs Terrain
   - **Date** : Aujourd'hui
   - **Heure début** : 17:00
   - **Heure fin** : 18:00
3. Cliquer sur "Créer"
4. **Résultat attendu** : Tâche créée en statut DRAFT

#### 4. Modification d'une tâche brouillon
1. Trouver la tâche "Rapport hebdomadaire"
2. Cliquer sur "Modifier"
3. Ajouter plus de détails dans la description
4. Sauvegarder
5. **Résultat attendu** : Modifications enregistrées

#### 5. Soumission pour validation
1. Cliquer sur "Soumettre" sur la tâche brouillon
2. Confirmer la soumission
3. **Résultat attendu** : 
   - Statut passe à SUBMITTED 🔵
   - Notification envoyée au manager
   - Bouton "Modifier" désactivé

#### 6. Consultation des statistiques
1. Retour au Dashboard
2. Observer les statistiques :
   - Total heures travaillées
   - Répartition par statut
   - Graphiques d'activité
3. **Résultat attendu** : Statistiques à jour avec la nouvelle tâche

---

## Scénario 2 : Validation manager

### 🎯 Objectif
Démontrer le processus de validation des tâches par un manager.

### 👤 Utilisateur
**Marie Martin** - Manager  
📧 `manager@atw.com` / 🔑 `demo123`

### 📝 Étapes

#### 1. Connexion et vue d'ensemble
1. Se connecter avec les identifiants de Marie
2. Observer le dashboard manager
3. **Résultat attendu** : 
   - Vue de toutes les tâches de l'équipe
   - Compteur de tâches en attente de validation

#### 2. Consultation des tâches en attente
1. Aller dans "Timesheet"
2. Filtrer par statut "SUBMITTED"
3. **Résultat attendu** : Liste des tâches à valider

#### 3. Validation d'une tâche
1. Sélectionner la tâche "Saisie et analyse" de Sophie
2. Cliquer sur "Détails"
3. Vérifier les informations :
   - Durée : 4 heures
   - Domaine : Enquêteurs Terrain
   - Description complète
4. Cliquer sur "Approuver"
5. **Résultat attendu** :
   - Statut passe à APPROVED ✅
   - Notification envoyée à Sophie
   - Tâche apparaît dans les statistiques validées

#### 4. Rejet d'une tâche avec commentaire
1. Sélectionner une tâche avec des informations incomplètes
2. Cliquer sur "Rejeter"
3. Ajouter un commentaire : "Merci de préciser les livrables attendus"
4. Confirmer le rejet
5. **Résultat attendu** :
   - Statut passe à REJECTED ❌
   - Notification avec commentaire envoyée
   - Employé peut modifier et resoumettre

#### 5. Vue calendrier équipe
1. Aller dans "Calendrier"
2. Sélectionner "Vue équipe"
3. Observer les créneaux de tous les employés
4. **Résultat attendu** : 
   - Calendrier consolidé de l'équipe
   - Filtres par domaine et utilisateur
   - Identification rapide des conflits

#### 6. Statistiques d'équipe
1. Retour au Dashboard
2. Section "Statistiques d'équipe"
3. Observer :
   - Heures totales par domaine
   - Productivité par employé
   - Taux de validation
4. **Résultat attendu** : Graphiques et métriques à jour

---

## Scénario 3 : Administration

### 🎯 Objectif
Démontrer les fonctionnalités d'administration du système.

### 👤 Utilisateur
**Jean Dupont** - Administrateur  
📧 `admin@atw.com` / 🔑 `demo123`

### 📝 Étapes

#### 1. Gestion des utilisateurs
1. Se connecter en tant qu'admin
2. Aller dans "Administration" > "Utilisateurs"
3. Observer la liste complète des utilisateurs
4. **Actions possibles** :
   - Modifier le rôle d'un utilisateur
   - Désactiver/Activer un compte
   - Voir l'historique d'activité

#### 2. Gestion des domaines
1. Aller dans "Administration" > "Domaines"
2. Observer les 6 domaines existants
3. Créer un nouveau domaine :
   - **Nom** : "Logistique"
   - **Slug** : "logistique"
   - **Description** : "Gestion de la chaîne logistique"
4. **Résultat attendu** : Nouveau domaine disponible pour tous

#### 3. Vue globale des timesheets
1. Aller dans "Timesheet"
2. Activer les filtres avancés :
   - Tous les utilisateurs
   - Tous les domaines
   - Toutes les périodes
3. **Résultat attendu** : Vue exhaustive de toutes les tâches

#### 4. Statistiques globales
1. Dashboard admin
2. Observer les métriques :
   - Total heures système
   - Répartition par domaine
   - Taux d'utilisation
   - Tendances hebdomadaires
3. **Résultat attendu** : Vue d'ensemble complète du système

#### 5. Export de données
1. Aller dans "Rapports"
2. Sélectionner une période
3. Choisir le format (PDF/Excel)
4. Générer le rapport
5. **Résultat attendu** : Rapport téléchargeable avec toutes les données

---

## Scénario 4 : Réinitialisation mot de passe

### 🎯 Objectif
Démontrer le flux complet de récupération de mot de passe.

### 📝 Étapes

#### 1. Demande de réinitialisation
1. Sur la page de connexion, cliquer sur "Mot de passe oublié ?"
2. Entrer l'email : `thomas.petit@atw.com`
3. Cliquer sur "Envoyer le lien"
4. **Résultat attendu** : 
   - Message de confirmation
   - Email envoyé (visible dans Mailtrap)

#### 2. Vérification de l'email
1. Aller sur Mailtrap : https://mailtrap.io/
2. Ouvrir l'inbox de test
3. Observer l'email reçu :
   - Expéditeur : noreply@atw-timesheet.com
   - Sujet : "Reset your password"
   - Contenu : Lien de réinitialisation
4. **Résultat attendu** : Email bien formaté avec lien cliquable

#### 3. Réinitialisation du mot de passe
1. Cliquer sur le lien dans l'email
2. Redirection vers la page de réinitialisation
3. Entrer le nouveau mot de passe : `newdemo123`
4. Confirmer le mot de passe
5. Cliquer sur "Réinitialiser"
6. **Résultat attendu** : 
   - Message de succès
   - Redirection vers la page de connexion

#### 4. Connexion avec nouveau mot de passe
1. Se connecter avec :
   - Email : `thomas.petit@atw.com`
   - Mot de passe : `newdemo123`
2. **Résultat attendu** : Connexion réussie

---

## Données de test

### 👥 Utilisateurs disponibles

| Nom | Email | Rôle | Mot de passe |
|-----|-------|------|--------------|
| Jean Dupont | admin@atw.com | ADMIN | demo123 |
| Marie Martin | manager@atw.com | MANAGER | demo123 |
| Sophie Bernard | sophie.bernard@atw.com | EMPLOYEE | demo123 |
| Thomas Petit | thomas.petit@atw.com | EMPLOYEE | demo123 |
| Julie Dubois | julie.dubois@atw.com | EMPLOYEE | demo123 |
| Pierre Moreau | pierre.moreau@atw.com | EMPLOYEE | demo123 |

### 📂 Domaines disponibles

1. **Direction Générale** - Management stratégique
2. **Comptabilité & Finance** - Gestion financière
3. **Informatique & IT** - Développement et infrastructure
4. **Enquêteurs Terrain** - Collecte de données
5. **Ressources Humaines** - Gestion du personnel
6. **Marketing & Communication** - Communication externe

### 📋 Tâches pré-créées

- **Sophie Bernard** : 2 tâches (1 approuvée, 1 soumise)
- **Thomas Petit** : 2 tâches (1 approuvée, 1 brouillon)
- **Julie Dubois** : 2 tâches (1 approuvée, 1 soumise)
- **Pierre Moreau** : 2 tâches (1 approuvée, 1 rejetée)
- **Tâches historiques** : 2 tâches de la semaine dernière

### 📊 Statistiques attendues

- **Total utilisateurs** : 6
- **Total domaines** : 6
- **Total tâches** : 10+
- **Tâches approuvées** : ~50%
- **Tâches en attente** : ~25%
- **Tâches brouillon** : ~15%
- **Tâches rejetées** : ~10%

---

## 🎯 Points clés à démontrer

### Fonctionnalités techniques
- ✅ Architecture Docker multi-conteneurs
- ✅ API REST avec NestJS
- ✅ Frontend React avec Next.js
- ✅ Base de données PostgreSQL avec Prisma
- ✅ Authentification JWT
- ✅ Envoi d'emails avec templates
- ✅ Tests unitaires et d'intégration

### Fonctionnalités métier
- ✅ Gestion complète des timesheets
- ✅ Workflow de validation hiérarchique
- ✅ Calendrier hebdomadaire interactif
- ✅ Dashboard avec statistiques temps réel
- ✅ Gestion des rôles et permissions
- ✅ Notifications et alertes
- ✅ Export de rapports

### Qualité du code
- ✅ Code TypeScript strict
- ✅ Architecture modulaire et scalable
- ✅ Gestion d'erreurs robuste
- ✅ Validation des données
- ✅ Sécurité (CORS, Helmet, Rate limiting)
- ✅ Documentation API (Swagger)
- ✅ Tests automatisés

---

## 📝 Notes pour la présentation

### Durée recommandée
- **Démo complète** : 30-45 minutes
- **Démo express** : 15-20 minutes (Scénarios 1 et 2 uniquement)

### Ordre suggéré
1. Introduction et architecture (5 min)
2. Scénario employé (10 min)
3. Scénario manager (10 min)
4. Fonctionnalités admin (5 min)
5. Aspects techniques (5 min)
6. Questions/Réponses (5-10 min)

### Points d'attention
- Préparer les données avant la démo (script demo-setup.sh)
- Tester tous les scénarios au moins une fois avant
- Avoir Mailtrap ouvert pour montrer les emails
- Préparer des réponses sur l'architecture et les choix techniques
- Montrer le code source pour les parties intéressantes

---

## 🚀 Commandes utiles

```bash
# Réinitialiser la démo
./scripts/demo-setup.sh

# Voir les logs en temps réel
docker-compose logs -f api

# Accéder à la base de données
docker-compose exec postgres psql -U postgres -d atw_timesheet

# Exécuter les tests
npm run test

# Générer un rapport de couverture
npm run test:cov

# Rebuild complet
docker-compose down -v
docker-compose up --build -d
```

---

**Bonne démonstration ! 🎉**
