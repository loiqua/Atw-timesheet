#!/bin/bash

# Script de configuration de la démo avec données réalistes
# Usage: ./scripts/demo-setup.sh

echo "🎬 Configuration de la démonstration ATW Timesheet"
echo "=================================================="
echo ""

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution"
    echo "   Veuillez démarrer Docker et réessayer"
    exit 1
fi

echo "📦 Arrêt des conteneurs existants..."
docker-compose down

echo ""
echo "🗄️  Réinitialisation de la base de données..."
docker-compose up -d postgres
sleep 5

echo ""
echo "🔄 Application des migrations..."
docker-compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS atw_timesheet;"
docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE atw_timesheet;"

echo ""
echo "🚀 Démarrage de l'API..."
docker-compose up -d api
sleep 10

echo ""
echo "🌱 Exécution du seed de démonstration..."
docker-compose exec -T api npx tsx prisma/seed-demo.ts

echo ""
echo "🎨 Démarrage du frontend..."
docker-compose up -d frontend
sleep 5

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "🌐 Accès à l'application :"
echo "   Frontend : http://localhost:3000"
echo "   API      : http://localhost:8000"
echo ""
echo "🔑 Identifiants de test :"
echo "   Admin    : admin@atw.com / demo123"
echo "   Manager  : manager@atw.com / demo123"
echo "   Employé  : sophie.bernard@atw.com / demo123"
echo ""
echo "📊 Données disponibles :"
echo "   - 6 utilisateurs (1 admin, 1 manager, 4 employés)"
echo "   - 6 domaines métier"
echo "   - 10+ tâches avec différents statuts"
echo ""
echo "🎬 Prêt pour la démonstration !"
