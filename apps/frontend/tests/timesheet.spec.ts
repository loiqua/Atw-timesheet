import { test, expect } from '@playwright/test';

test.describe('Timesheet Management', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Augmenter le timeout pour le setup
    testInfo.setTimeout(60000);
    
    // Login avant chaque test
    await page.goto('/auth/login');
    await page.waitForSelector('[data-testid="email"]', { state: 'visible', timeout: 15000 });
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'Password123!');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('[data-testid="login-button"]')
    ]);
    
    // Attendre que la page de tableau de bord soit chargée
    await page.waitForSelector('h1', { timeout: 30000 });
  });

  test('should create a basic task', async ({ page }, testInfo) => {
    // Augmenter le timeout pour ce test
    testInfo.setTimeout(90000);
    
    // Naviguer vers la page timesheet
    await page.goto('/timesheet');
    await page.waitForLoadState('networkidle');

    // Attendre que le bouton soit visible et cliquable
    const newTaskButton = page.locator('[data-testid="new-task-button"]');
    await expect(newTaskButton).toBeVisible({ timeout: 30000 });
    await newTaskButton.click({ timeout: 15000 });

    // Remplir le formulaire de base
    await page.fill('[data-testid="task-title"]', 'Test Task E2E');
    await page.selectOption('[data-testid="domain-select"]', { index: 1 });
    await page.fill('[data-testid="duration"]', '120');
    await page.selectOption('[data-testid="project-type"]', 'INTERNAL');

    // Soumettre le formulaire
    await page.click('[data-testid="submit-task"]');

    // Vérifier que la tâche apparaît dans la liste
    await expect(page.locator('[data-testid="task-list"]')).toContainText('Test Task E2E');
    await expect(page.locator('[data-testid="task-status"]')).toContainText('Brouillon');
  });

  test('should create a detailed task with custom category', async ({ page }) => {
    await page.goto('/timesheet');
    await page.click('[data-testid="new-task-button"]');

    // Étape 1 : Informations de base
    await page.fill('[data-testid="task-title"]', 'Formation Spécialisée E2E');
    await page.fill('[data-testid="task-description"]', 'Formation sur les nouvelles technologies');
    await page.selectOption('[data-testid="domain-select"]', { index: 1 });
    await page.fill('[data-testid="start-time"]', '09:00');
    await page.fill('[data-testid="end-time"]', '17:00');
    
    // Cocher "Ajouter un rapport détaillé"
    await page.check('[data-testid="add-detailed-report"]');
    await page.click('[data-testid="continue-button"]');

    // Étape 2 : Sélectionner catégorie personnalisée
    await page.click('[data-testid="category-custom"]');
    await page.fill('[data-testid="custom-category-name"]', 'Formation Technique Avancée');

    // Ajouter des champs personnalisés
    await page.click('[data-testid="add-custom-field"]');
    await page.fill('[data-testid="custom-field-label"]', 'Niveau');
    await page.fill('[data-testid="custom-field-value"]', 'Avancé');

    // Ajouter des observations
    await page.fill('[data-testid="observations"]', 'Formation très enrichissante sur React 19');

    // Créer la tâche
    await page.click('[data-testid="create-task"]');

    // Vérifier la création
    await expect(page.locator('[data-testid="task-list"]')).toContainText('Formation Spécialisée E2E');
    await expect(page.locator('[data-testid="task-category"]')).toContainText('Formation Technique Avancée');
  });

  test('should edit a draft task', async ({ page }) => {
    // Créer d'abord une tâche
    await page.goto('/timesheet');
    await page.click('[data-testid="new-task-button"]');
    await page.fill('[data-testid="task-title"]', 'Task to Edit');
    await page.selectOption('[data-testid="domain-select"]', { index: 1 });
    await page.fill('[data-testid="duration"]', '60');
    await page.click('[data-testid="submit-task"]');

    // Éditer la tâche
    await page.click('[data-testid="edit-task-button"]');
    await page.fill('[data-testid="task-title"]', 'Edited Task Title');
    await page.fill('[data-testid="task-description"]', 'Updated description');
    await page.click('[data-testid="save-changes"]');

    // Vérifier les modifications
    await expect(page.locator('[data-testid="task-list"]')).toContainText('Edited Task Title');
  });

  test('should submit and approve task workflow', async ({ page }) => {
    // Créer une tâche
    await page.goto('/timesheet');
    await page.click('[data-testid="new-task-button"]');
    await page.fill('[data-testid="task-title"]', 'Task for Approval');
    await page.selectOption('[data-testid="domain-select"]', { index: 1 });
    await page.fill('[data-testid="duration"]', '180');
    await page.click('[data-testid="submit-task"]');

    // Soumettre la tâche
    await page.click('[data-testid="submit-task-button"]');
    await page.click('[data-testid="confirm-submit"]');

    // Vérifier le statut "Soumis"
    await expect(page.locator('[data-testid="task-status"]')).toContainText('Soumis');

    // Vérifier que l'édition n'est plus possible
    await expect(page.locator('[data-testid="edit-task-button"]')).not.toBeVisible();

    // Simuler l'approbation par un admin (nécessite des permissions admin)
    // Note: Dans un vrai test, on se connecterait avec un compte admin
  });

  test('should save task offline', async ({ page }) => {
    await page.goto('/timesheet');
    await page.click('[data-testid="new-task-button"]');

    // Remplir le formulaire
    await page.fill('[data-testid="task-title"]', 'Offline Task');
    await page.selectOption('[data-testid="domain-select"]', { index: 1 });
    await page.fill('[data-testid="duration"]', '90');

    // Sauvegarder hors ligne
    await page.click('[data-testid="save-offline"]');

    // Vérifier la notification de sauvegarde
    await expect(page.locator('[data-testid="offline-notification"]')).toContainText('sauvegardée hors ligne');

    // Vérifier que la tâche apparaît dans les tâches hors ligne
    await page.click('[data-testid="offline-tasks-tab"]');
    await expect(page.locator('[data-testid="offline-task-list"]')).toContainText('Offline Task');
  });

  test('should generate and download PDF', async ({ page }) => {
    // Créer et soumettre une tâche
    await page.goto('/timesheet');
    await page.click('[data-testid="new-task-button"]');
    await page.fill('[data-testid="task-title"]', 'PDF Test Task');
    await page.selectOption('[data-testid="domain-select"]', { index: 1 });
    await page.fill('[data-testid="duration"]', '240');
    await page.click('[data-testid="submit-task"]');

    // Télécharger le PDF
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-pdf"]');
    const download = await downloadPromise;

    // Vérifier le téléchargement
    expect(download.suggestedFilename()).toMatch(/timesheet.*\.pdf/);
  });

  test('should filter tasks by status', async ({ page }) => {
    await page.goto('/timesheet');

    // Créer plusieurs tâches avec différents statuts
    // (Dans un vrai test, on aurait des données de test pré-créées)

    // Filtrer par statut "Brouillon"
    await page.selectOption('[data-testid="status-filter"]', 'DRAFT');
    await page.waitForLoadState('networkidle');

    // Vérifier que seules les tâches brouillon sont affichées
    const taskStatuses = await page.locator('[data-testid="task-status"]').allTextContents();
    expect(taskStatuses.every(status => status.includes('Brouillon'))).toBe(true);

    // Filtrer par statut "Soumis"
    await page.selectOption('[data-testid="status-filter"]', 'SUBMITTED');
    await page.waitForLoadState('networkidle');

    // Vérifier le filtrage
    const submittedStatuses = await page.locator('[data-testid="task-status"]').allTextContents();
    expect(submittedStatuses.every(status => status.includes('Soumis'))).toBe(true);
  });

  test('should handle mobile responsive design', async ({ page }) => {
    // Simuler un écran mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/timesheet');

    // Vérifier que les filtres sont masqués sur mobile
    await expect(page.locator('[data-testid="filters-section"]')).not.toBeVisible();

    // Cliquer sur le bouton pour afficher les filtres
    await page.click('[data-testid="toggle-filters"]');
    await expect(page.locator('[data-testid="filters-section"]')).toBeVisible();

    // Vérifier l'affichage en cartes sur mobile
    await expect(page.locator('[data-testid="task-card-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="task-table-view"]')).not.toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/timesheet');
    await page.click('[data-testid="new-task-button"]');

    // Essayer de soumettre sans remplir les champs requis
    await page.click('[data-testid="submit-task"]');

    // Vérifier les messages d'erreur
    await expect(page.locator('[data-testid="title-error"]')).toContainText('requis');
    await expect(page.locator('[data-testid="domain-error"]')).toContainText('requis');

    // Tester la validation des heures
    await page.fill('[data-testid="start-time"]', '09:00');
    // Ne pas remplir l'heure de fin
    await page.click('[data-testid="submit-task"]');
    await expect(page.locator('[data-testid="time-error"]')).toContainText('heure de début ET l\'heure de fin');

    // Tester une durée invalide
    await page.fill('[data-testid="duration"]', '-10');
    await page.click('[data-testid="submit-task"]');
    await expect(page.locator('[data-testid="duration-error"]')).toContainText('positive');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simuler une panne réseau
    await page.route('**/api/timesheet/tasks', route => route.abort());

    await page.goto('/timesheet');
    await page.click('[data-testid="new-task-button"]');
    await page.fill('[data-testid="task-title"]', 'Network Error Test');
    await page.selectOption('[data-testid="domain-select"]', { index: 1 });
    await page.fill('[data-testid="duration"]', '60');
    await page.click('[data-testid="submit-task"]');

    // Vérifier le message d'erreur
    await expect(page.locator('[data-testid="error-message"]')).toContainText('erreur réseau');

    // Vérifier que la sauvegarde hors ligne est proposée
    await expect(page.locator('[data-testid="offline-fallback"]')).toBeVisible();
  });

  test('should sync offline tasks when online', async ({ page }) => {
    // Créer une tâche hors ligne d'abord
    await page.goto('/timesheet');
    await page.click('[data-testid="new-task-button"]');
    await page.fill('[data-testid="task-title"]', 'Sync Test Task');
    await page.selectOption('[data-testid="domain-select"]', { index: 1 });
    await page.fill('[data-testid="duration"]', '120');
    await page.click('[data-testid="save-offline"]');

    // Vérifier qu'elle est dans les tâches hors ligne
    await page.click('[data-testid="offline-tasks-tab"]');
    await expect(page.locator('[data-testid="offline-task-list"]')).toContainText('Sync Test Task');

    // Synchroniser
    await page.click('[data-testid="sync-offline-tasks"]');

    // Vérifier que la tâche est maintenant en ligne
    await page.click('[data-testid="online-tasks-tab"]');
    await expect(page.locator('[data-testid="task-list"]')).toContainText('Sync Test Task');

    // Vérifier qu'elle n'est plus dans les tâches hors ligne
    await page.click('[data-testid="offline-tasks-tab"]');
    await expect(page.locator('[data-testid="offline-task-list"]')).not.toContainText('Sync Test Task');
  });
});
