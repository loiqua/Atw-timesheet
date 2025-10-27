import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  // Vérifier si des domaines existent déjà
  const existingDomains = await prisma.domain.findMany();
  console.log('Domaines existants:', existingDomains.map((d: { name: string; slug: string }) => `${d.name} (${d.slug})`).join(', ') || 'aucun');

  // Créer les domaines de base
  const domains = [
    { name: 'Direction', slug: 'direction', description: 'Direction' },
    { name: 'Études et Conseil', slug: 'etudes-et-conseil', description: 'Études et Conseil' },
    { name: 'Informatique', slug: 'informatique', description: 'Informatique' },
    { name: 'Comptabilité et Finance', slug: 'comptabilite-et-finance', description: 'Comptabilité et Finance' },
    { name: 'Qualité et Statistiques', slug: 'qualite-et-statistiques', description: 'Qualité et Statistiques' },
    { name: 'Terrain et Enquêtes', slug: 'terrain-et-enquetes', description: 'Terrain et Enquêtes' },
    { name: 'Administration et Support', slug: 'administration-et-support', description: 'Administration et Support' },
  ];

  for (const domain of domains) {
    await prisma.domain.upsert({
      where: { slug: domain.slug },
      update: { name: domain.name, description: domain.description },
      create: domain,
    });
    console.log(`✅ Domaine créé : ${domain.name} (${domain.slug})`);
  }

  console.log('🌱 Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
