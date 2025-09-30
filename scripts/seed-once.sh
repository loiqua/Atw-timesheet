#!/bin/sh
# Script pour exécuter le seed une seule fois en production

SEED_FLAG="/app/.seed-completed"

if [ ! -f "$SEED_FLAG" ]; then
  echo "🌱 Exécution du seed initial..."
  npx prisma db seed
  
  if [ $? -eq 0 ]; then
    touch "$SEED_FLAG"
    echo "✅ Seed exécuté avec succès"
  else
    echo "❌ Erreur lors du seed"
    exit 1
  fi
else
  echo "ℹ️  Seed déjà exécuté, passage..."
fi
