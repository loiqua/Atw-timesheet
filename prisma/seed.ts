import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  // Vérifier si des domaines existent déjà
  const existingDomains = await prisma.domain.findMany();
  
  if (existingDomains.length > 0) {
    console.log('✅ Des domaines existent déjà, skip du seed.');
    console.log('Domaines existants:', existingDomains.map((d: { name: string; slug: string }) => `${d.name} (${d.slug})`).join(', '));
    return;
  }

  // Créer les domaines de base
  const domains = [
    { name: 'Direction', slug: 'direction', description: 'Direction générale' },
    { name: 'Comptabilité', slug: 'comptabilite', description: 'Service comptable' },
    { name: 'Informatique', slug: 'informatique', description: 'Service informatique' },
    { name: 'Enquêteurs', slug: 'enqueteurs', description: 'Équipe des enquêteurs' },
    { name: 'Ressources Humaines', slug: 'rh', description: 'Service des ressources humaines' },
  ];

  for (const domain of domains) {
    await prisma.domain.upsert({
      where: { slug: domain.slug },
      update: {},
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
