'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, Calendar, FileText, Building2 } from 'lucide-react';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { updateTask, listDomains, type Domain } from '@/features/timesheet/api';
import type { Task, UpdateTaskInput, ReportType } from '@/features/timesheet/types';

interface EditTaskDialogProps {
  readonly task: Task | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

interface EditTaskFormData {
  title: string;
  description: string;
  domainId: string;
  reportType: ReportType;
  reportCategory: string;
  // Champs structurés pour le rapport
  objectives: string;
  results: string;
  difficulties: string;
  nextSteps: string;
  timeSpent: string;
  resources: string;
}

export const EditTaskDialog: React.FC<EditTaskDialogProps> = ({
  task,
  open,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<EditTaskFormData>({
    title: '',
    description: '',
    domainId: '',
    reportType: 'STANDARD',
    reportCategory: '',
    objectives: '',
    results: '',
    difficulties: '',
    nextSteps: '',
    timeSpent: '',
    resources: '',
  });

  const [domains, setDomains] = useState<readonly Domain[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load domains
  useEffect(() => {
    const loadData = async () => {
      if (!open) return;
      
      setIsLoadingData(true);
      try {
        const domainsData = await listDomains();
        setDomains(domainsData);
      } catch (error) {
        console.error('Erreur lors du chargement des domaines:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [open]);

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      const reportContent = task.report?.content as Record<string, unknown> || {};
      
      setFormData({
        title: task.title,
        description: task.description ?? '',
        domainId: task.domainId,
        reportType: task.report?.type ?? 'STANDARD',
        reportCategory: reportContent.category as string || '',
        objectives: reportContent.objectives as string || '',
        results: reportContent.results as string || '',
        difficulties: reportContent.difficulties as string || '',
        nextSteps: reportContent.nextSteps as string || '',
        timeSpent: reportContent.timeSpent as string || '',
        resources: reportContent.resources as string || '',
      });
    }
  }, [task]);

  const updateTaskMutation = useMutation({
    mutationFn: async (data: EditTaskFormData) => {
      if (!task) throw new Error('No task to update');
      
      // Validation des données avant envoi
      if (!data.title.trim()) {
        throw new Error('Le titre est obligatoire');
      }
      
      if (!data.domainId || data.domainId.trim() === '' || data.domainId === 'no-domains') {
        throw new Error('Le domaine est obligatoire');
      }
      
      // Vérifier que le domaine existe dans la liste
      const domainExists = domains.find(d => d.id === data.domainId);
      if (!domainExists) {
        throw new Error('Le domaine sélectionné n\'existe pas');
      }
      
      // Construire le contenu du rapport à partir des champs structurés
      const reportContent: Record<string, unknown> = {};
      
      if (data.reportCategory.trim()) reportContent.category = data.reportCategory.trim();
      if (data.objectives.trim()) reportContent.objectives = data.objectives.trim();
      if (data.results.trim()) reportContent.results = data.results.trim();
      if (data.difficulties.trim()) reportContent.difficulties = data.difficulties.trim();
      if (data.nextSteps.trim()) reportContent.nextSteps = data.nextSteps.trim();
      if (data.timeSpent.trim()) reportContent.timeSpent = data.timeSpent.trim();
      if (data.resources.trim()) reportContent.resources = data.resources.trim();

      const updateData: UpdateTaskInput = {
        title: data.title.trim(),
        description: data.description.trim() || undefined,
        domainId: data.domainId,
        reportType: data.reportType,
        reportCategory: data.reportCategory.trim() || undefined,
        reportContent: Object.keys(reportContent).length > 0 ? reportContent : undefined,
      };
      
      return updateTask(task.id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`Erreur lors de la mise à jour de la tâche: ${errorMessage}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTaskMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof EditTaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Brouillon';
      case 'SUBMITTED': return 'Soumis';
      case 'APPROVED': return 'Approuvé';
      case 'REJECTED': return 'Rejeté';
      default: return status;
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Modifier la tâche
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Info */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(task.date).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn(getStatusColor(task.status))}
                >
                  {getStatusLabel(task.status)}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre de la tâche *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Entrez le titre de la tâche"
                required
              />
            </div>

            {/* Domain */}
            <div className="space-y-2">
              <Label htmlFor="domain">Domaine *</Label>
              <Select
                value={formData.domainId}
                onValueChange={(value: string) => handleInputChange('domainId', value)}
                disabled={isLoadingData}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Sélectionner un domaine" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {domains.length === 0 ? (
                    <SelectItem value="no-domains" disabled>
                      {isLoadingData ? 'Chargement...' : 'Aucun domaine disponible'}
                    </SelectItem>
                  ) : (
                    domains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                placeholder="Décrivez la tâche effectuée..."
                rows={4}
                className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
              />
            </div>

            {/* Section Rapport */}
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Rapport de tâche
              </h3>

              {/* Type de rapport */}
              <div className="space-y-2">
                <Label htmlFor="reportType">Type de rapport</Label>
                <Select
                  value={formData.reportType}
                  onValueChange={(value: string) => handleInputChange('reportType', value as ReportType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="CUSTOM">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Catégorie */}
              <div className="space-y-2">
                <Label htmlFor="reportCategory">Catégorie</Label>
                <Input
                  id="reportCategory"
                  value={formData.reportCategory}
                  onChange={(e) => handleInputChange('reportCategory', e.target.value)}
                  placeholder="Ex: Développement, Réunion, Formation..."
                />
              </div>

              {/* Champs structurés du rapport */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Objectifs */}
                <div className="space-y-2">
                  <Label htmlFor="objectives">Objectifs</Label>
                  <textarea
                    id="objectives"
                    value={formData.objectives}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('objectives', e.target.value)}
                    placeholder="Quels étaient les objectifs de cette tâche ?"
                    rows={3}
                    className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                  />
                </div>

                {/* Résultats */}
                <div className="space-y-2">
                  <Label htmlFor="results">Résultats obtenus</Label>
                  <textarea
                    id="results"
                    value={formData.results}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('results', e.target.value)}
                    placeholder="Quels résultats avez-vous obtenus ?"
                    rows={3}
                    className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                  />
                </div>

                {/* Difficultés */}
                <div className="space-y-2">
                  <Label htmlFor="difficulties">Difficultés rencontrées</Label>
                  <textarea
                    id="difficulties"
                    value={formData.difficulties}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('difficulties', e.target.value)}
                    placeholder="Quelles difficultés avez-vous rencontrées ?"
                    rows={3}
                    className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                  />
                </div>

                {/* Prochaines étapes */}
                <div className="space-y-2">
                  <Label htmlFor="nextSteps">Prochaines étapes</Label>
                  <textarea
                    id="nextSteps"
                    value={formData.nextSteps}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('nextSteps', e.target.value)}
                    placeholder="Quelles sont les prochaines étapes ?"
                    rows={3}
                    className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                  />
                </div>

                {/* Temps passé */}
                <div className="space-y-2">
                  <Label htmlFor="timeSpent">Temps passé</Label>
                  <Input
                    id="timeSpent"
                    value={formData.timeSpent}
                    onChange={(e) => handleInputChange('timeSpent', e.target.value)}
                    placeholder="Ex: 2h30, 1 journée, etc."
                  />
                </div>

                {/* Ressources utilisées */}
                <div className="space-y-2">
                  <Label htmlFor="resources">Ressources utilisées</Label>
                  <Input
                    id="resources"
                    value={formData.resources}
                    onChange={(e) => handleInputChange('resources', e.target.value)}
                    placeholder="Ex: Documentation, outils, personnes consultées..."
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateTaskMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={updateTaskMutation.isPending || !formData.title.trim()}
              >
                {updateTaskMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
