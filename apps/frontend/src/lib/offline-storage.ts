/**
 * Service de gestion du stockage hors ligne
 * Permet de sauvegarder et synchroniser les données localement
 */

import type { CreateTaskInput, ReportType } from "@/features/timesheet/types";

export interface OfflineTask {
  id: string;
  title: string;
  description?: string;
  domainId: string;
  date: string;
  durationMin: number;
  projectType: string;
  category?: string;
  reportFields: Record<string, string | number>;
  customFields: Array<{
    id: string;
    label: string;
    type: string;
    value: string | number | boolean;
  }>;
  comments?: string;
  createdAt: string;
  status: 'offline' | 'syncing' | 'synced';
}

const STORAGE_KEY = 'atw_offline_tasks';

export class OfflineStorageService {
  /**
   * Sauvegarder une tâche hors ligne
   */
  static saveTask(task: Omit<OfflineTask, 'id' | 'createdAt' | 'status'>): string {
    const tasks = this.getTasks();
    const newTask: OfflineTask = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'offline'
    };
    
    tasks.push(newTask);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    
    console.log('✅ Tâche sauvegardée hors ligne:', newTask.title);
    return newTask.id;
  }

  /**
   * Récupérer toutes les tâches hors ligne
   */
  static getTasks(): OfflineTask[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erreur lors de la lecture du stockage hors ligne:', error);
      return [];
    }
  }

  /**
   * Récupérer une tâche par ID
   */
  static getTask(id: string): OfflineTask | null {
    const tasks = this.getTasks();
    return tasks.find(task => task.id === id) || null;
  }

  /**
   * Mettre à jour le statut d'une tâche
   */
  static updateTaskStatus(id: string, status: OfflineTask['status']): void {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex !== -1) {
      tasks[taskIndex].status = status;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }

  /**
   * Supprimer une tâche
   */
  static deleteTask(id: string): void {
    const tasks = this.getTasks();
    const filteredTasks = tasks.filter(task => task.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredTasks));
  }

  /**
   * Obtenir le nombre de tâches en attente de synchronisation
   */
  static getPendingSyncCount(): number {
    const tasks = this.getTasks();
    return tasks.filter(task => task.status === 'offline').length;
  }

  /**
   * Synchroniser toutes les tâches hors ligne avec le serveur
   */
  static async syncTasks(
    createTaskFn: (task: CreateTaskInput) => Promise<void>
  ): Promise<{ success: number; failed: number }> {
    const tasks = this.getTasks();
    const offlineTasks = tasks.filter(task => task.status === 'offline');
    
    let success = 0;
    let failed = 0;

    for (const task of offlineTasks) {
      try {
        // Marquer comme en cours de synchronisation
        this.updateTaskStatus(task.id, 'syncing');

        // Convertir au format attendu par l'API
        const apiTask: CreateTaskInput = {
          domainId: task.domainId,
          title: task.title,
          description: task.description ?? null,
          date: task.date,
          durationMin: task.durationMin,
          reportType: (task.category === "Custom" ? "CUSTOM" : "STANDARD") as ReportType,
          reportCategory: task.category,
          reportContent: {
            projectType: task.projectType,
            category: task.category,
            ...task.reportFields,
            ...task.customFields.reduce((acc, field) => {
              if (field.label.trim()) {
                acc[field.label.trim()] = field.value;
              }
              return acc;
            }, {} as Record<string, string | number | boolean>),
            comments: task.comments
          }
        };

        // Envoyer au serveur
        await createTaskFn(apiTask);
        
        // Marquer comme synchronisé
        this.updateTaskStatus(task.id, 'synced');
        success++;
        
        console.log('✅ Tâche synchronisée:', task.title);
        
        // Supprimer après synchronisation réussie
        setTimeout(() => this.deleteTask(task.id), 1000);
        
      } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
        // Remettre en offline en cas d'erreur
        this.updateTaskStatus(task.id, 'offline');
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Vérifier si le mode hors ligne est disponible
   */
  static isAvailable(): boolean {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtenir les statistiques du stockage
   */
  static getStats() {
    const tasks = this.getTasks();
    return {
      total: tasks.length,
      offline: tasks.filter(t => t.status === 'offline').length,
      syncing: tasks.filter(t => t.status === 'syncing').length,
      synced: tasks.filter(t => t.status === 'synced').length,
      storageUsed: new Blob([localStorage.getItem(STORAGE_KEY) ?? '']).size
    };
  }
}
