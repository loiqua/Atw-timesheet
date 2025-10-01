import { PrismaClient, Role, TaskStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed de démonstration...');

  // Nettoyer les données existantes (pour démo uniquement)
  console.log('🧹 Nettoyage des données existantes...');
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
  await prisma.domain.deleteMany();

  // ========================================
  // 1. CRÉER LES DOMAINES RÉALISTES
  // ========================================
  console.log('\n📂 Création des domaines...');
  const domains = [
    {
      name: 'Direction Générale',
      slug: 'direction',
      description: 'Direction et management stratégique de l\'entreprise',
    },
    {
      name: 'Comptabilité & Finance',
      slug: 'comptabilite',
      description: 'Gestion financière, comptabilité et contrôle de gestion',
    },
    {
      name: 'Informatique & IT',
      slug: 'informatique',
      description: 'Développement, infrastructure et support technique',
    },
    {
      name: 'Enquêteurs Terrain',
      slug: 'enqueteurs',
      description: 'Équipe d\'enquêteurs et collecte de données terrain',
    },
    {
      name: 'Ressources Humaines',
      slug: 'rh',
      description: 'Recrutement, formation et gestion du personnel',
    },
    {
      name: 'Marketing & Communication',
      slug: 'marketing',
      description: 'Communication externe, marketing et relations publiques',
    },
  ];

  const createdDomains: { id: string; name: string; slug: string }[] = [];
  for (const domain of domains) {
    const created = await prisma.domain.create({ data: domain });
    createdDomains.push(created);
    console.log(`  ✅ ${domain.name}`);
  }

  // ========================================
  // 2. CRÉER DES UTILISATEURS RÉALISTES
  // ========================================
  console.log('\n👥 Création des utilisateurs...');
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const users = [
    {
      email: 'admin@atw.com',
      username: 'admin',
      fullName: 'Jean Dupont',
      password: hashedPassword,
      role: 'ADMIN' as Role,
      isActive: true,
    },
    {
      email: 'manager@atw.com',
      username: 'manager',
      fullName: 'Marie Martin',
      password: hashedPassword,
      role: 'MANAGER' as Role,
      isActive: true,
    },
    {
      email: 'sophie.bernard@atw.com',
      username: 'sophie.bernard',
      fullName: 'Sophie Bernard',
      password: hashedPassword,
      role: 'EMPLOYEE' as Role,
      isActive: true,
    },
    {
      email: 'thomas.petit@atw.com',
      username: 'thomas.petit',
      fullName: 'Thomas Petit',
      password: hashedPassword,
      role: 'EMPLOYEE' as Role,
      isActive: true,
    },
    {
      email: 'julie.dubois@atw.com',
      username: 'julie.dubois',
      fullName: 'Julie Dubois',
      password: hashedPassword,
      role: 'EMPLOYEE' as Role,
      isActive: true,
    },
    {
      email: 'pierre.moreau@atw.com',
      username: 'pierre.moreau',
      fullName: 'Pierre Moreau',
      password: hashedPassword,
      role: 'EMPLOYEE' as Role,
      isActive: true,
    },
  ];

  const createdUsers: { id: string; fullName: string; role: Role }[] = [];
  for (const user of users) {
    const created = await prisma.user.create({ data: user });
    createdUsers.push(created);
    console.log(`  ✅ ${user.fullName} (${user.role})`);
  }

  // ========================================
  // 3. CRÉER DES TÂCHES RÉALISTES
  // ========================================
  console.log('\n📋 Création des tâches réalistes...');

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Tâches pour Sophie Bernard (Enquêtrice)
  const sophieTasks = [
    {
      title: 'Enquête satisfaction client - Zone Nord',
      description:
        'Réaliser 50 interviews clients dans la zone Nord de Paris. Questionnaire de satisfaction produit.',
      date: today,
      startTime: '08:00',
      endTime: '12:00',
      durationMin: 240, // 4 heures
      status: TaskStatus.APPROVED,
      userId: createdUsers[2].id,
      domainId: createdDomains[3].id, // Enquêteurs
    },
    {
      title: 'Saisie et analyse des données collectées',
      description:
        'Saisir les résultats des enquêtes dans le système et préparer le rapport préliminaire.',
      date: today,
      startTime: '13:00',
      endTime: '17:00',
      durationMin: 240, // 4 heures
      status: TaskStatus.SUBMITTED,
      userId: createdUsers[2].id,
      domainId: createdDomains[3].id,
    },
  ];

  // Tâches pour Thomas Petit (Développeur)
  const thomasTasks = [
    {
      title: 'Développement API REST - Module Timesheet',
      description:
        'Implémenter les endpoints CRUD pour la gestion des timesheets. Tests unitaires inclus.',
      date: today,
      startTime: '09:00',
      endTime: '12:00',
      durationMin: 180, // 3 heures
      status: TaskStatus.APPROVED,
      userId: createdUsers[3].id,
      domainId: createdDomains[2].id, // Informatique
    },
    {
      title: 'Code Review et Refactoring',
      description:
        'Revue de code des PRs en attente et refactoring du module d\'authentification.',
      date: today,
      startTime: '14:00',
      endTime: '18:00',
      durationMin: 240, // 4 heures
      status: TaskStatus.DRAFT,
      userId: createdUsers[3].id,
      domainId: createdDomains[2].id,
    },
  ];

  // Tâches pour Julie Dubois (RH)
  const julieTasks = [
    {
      title: 'Entretiens de recrutement - Poste Développeur Senior',
      description:
        'Conduire 3 entretiens pour le poste de développeur senior. Évaluation technique et culturelle.',
      date: today,
      startTime: '09:00',
      endTime: '12:00',
      durationMin: 180, // 3 heures
      status: TaskStatus.APPROVED,
      userId: createdUsers[4].id,
      domainId: createdDomains[4].id, // RH
    },
    {
      title: 'Formation onboarding nouveaux employés',
      description:
        'Session de formation pour les 2 nouveaux employés : présentation de l\'entreprise et des outils.',
      date: today,
      startTime: '14:00',
      endTime: '16:00',
      durationMin: 120, // 2 heures
      status: TaskStatus.SUBMITTED,
      userId: createdUsers[4].id,
      domainId: createdDomains[4].id,
    },
  ];

  // Tâches pour Pierre Moreau (Comptable)
  const pierreTasks = [
    {
      title: 'Clôture comptable mensuelle - Janvier 2025',
      description:
        'Finaliser la clôture comptable du mois de janvier : rapprochements bancaires et déclarations.',
      date: today,
      startTime: '08:00',
      endTime: '12:00',
      durationMin: 240, // 4 heures
      status: TaskStatus.APPROVED,
      userId: createdUsers[5].id,
      domainId: createdDomains[1].id, // Comptabilité
    },
    {
      title: 'Préparation budget prévisionnel Q2',
      description:
        'Élaborer le budget prévisionnel du deuxième trimestre avec les chefs de service.',
      date: today,
      startTime: '13:00',
      endTime: '17:00',
      durationMin: 240, // 4 heures
      status: TaskStatus.REJECTED,
      userId: createdUsers[5].id,
      domainId: createdDomains[1].id,
      managerNote: 'Manque de détails sur les prévisions de dépenses IT',
    },
  ];

  // Tâches historiques (semaine dernière)
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const historicalTasks = [
    {
      title: 'Réunion stratégique trimestrielle',
      description: 'Présentation des résultats Q1 et planification Q2',
      date: lastWeek,
      startTime: '09:00',
      endTime: '12:00',
      durationMin: 180, // 3 heures
      status: TaskStatus.APPROVED,
      userId: createdUsers[0].id, // Admin
      domainId: createdDomains[0].id, // Direction
    },
    {
      title: 'Audit infrastructure serveurs',
      description: 'Audit complet de l\'infrastructure et recommandations',
      date: lastWeek,
      startTime: '08:00',
      endTime: '17:00',
      durationMin: 540, // 9 heures
      status: TaskStatus.APPROVED,
      userId: createdUsers[3].id, // Thomas
      domainId: createdDomains[2].id, // IT
    },
  ];

  const allTasks = [
    ...sophieTasks,
    ...thomasTasks,
    ...julieTasks,
    ...pierreTasks,
    ...historicalTasks,
  ];

  for (const task of allTasks) {
    await prisma.task.create({ 
      data: task as any // Cast nécessaire pour le seed
    });
  }

  console.log(`  ✅ ${allTasks.length} tâches créées`);

  // ========================================
  // 4. STATISTIQUES FINALES
  // ========================================
  console.log('\n📊 Statistiques de la base de données :');
  console.log(`  👥 Utilisateurs : ${createdUsers.length}`);
  console.log(`  📂 Domaines : ${createdDomains.length}`);
  console.log(`  📋 Tâches : ${allTasks.length}`);
  console.log(`     - Approuvées : ${allTasks.filter((t) => t.status === 'APPROVED').length}`);
  console.log(`     - Soumises : ${allTasks.filter((t) => t.status === 'SUBMITTED').length}`);
  console.log(`     - Brouillons : ${allTasks.filter((t) => t.status === 'DRAFT').length}`);
  console.log(`     - Rejetées : ${allTasks.filter((t) => t.status === 'REJECTED').length}`);

  console.log('\n🎉 Seed de démonstration terminé avec succès !');
  console.log('\n🔑 Identifiants de connexion :');
  console.log('  Admin    : admin@atw.com / demo123');
  console.log('  Manager  : manager@atw.com / demo123');
  console.log('  Employés : sophie.bernard@atw.com / demo123');
  console.log('             thomas.petit@atw.com / demo123');
  console.log('             julie.dubois@atw.com / demo123');
  console.log('             pierre.moreau@atw.com / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
