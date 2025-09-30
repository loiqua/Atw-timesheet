'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Save, 
  X, 
  Building2, 
  FileText,
  CheckCircle,
  ArrowRight,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateTask, listDomains, type Domain } from '@/features/timesheet/api';
import type { Task, UpdateTaskInput, ReportType } from '@/features/timesheet/types';
import { useAuthStore } from '@/lib/auth-store';

// Composants séparés pour réduire la complexité cognitive

interface NextButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const NextButton: React.FC<NextButtonProps> = ({ onClick, disabled }) => (
  <Button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="bg-blue-600 hover:bg-blue-700"
  >
    Suivant
    <ArrowRight className="h-4 w-4 ml-2" />
  </Button>
);

interface SaveButtonProps {
  label: string;
  disabled: boolean;
  isPending: boolean;
}

const SaveButton: React.FC<SaveButtonProps> = ({ label, disabled, isPending }) => (
  <Button
    type="submit"
    disabled={disabled}
    className="bg-green-600 hover:bg-green-700"
  >
    {isPending ? (
      <>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
        Enregistrement...
      </>
    ) : (
      <>
        <Save className="h-4 w-4 mr-2" />
        {label}
      </>
    )}
  </Button>
);

interface DialogHeaderContentProps {
  task: Task;
  currentStep: number;
  onClose: () => void;
  getStatusColor: (status: string) => string;
}

const DialogHeaderContent: React.FC<DialogHeaderContentProps> = ({ 
  task, 
  currentStep, 
  onClose, 
  getStatusColor 
}) => (
  <DialogHeader className="pb-4">
    <div className="flex items-center justify-between">
      <div>
        <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
          Modifier la tâche
        </DialogTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Modifiez les informations de votre tâche
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={cn('px-3 py-1 text-xs font-medium border', getStatusColor(task.status))}>
          {task.status}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
    
    {/* Progress indicator */}
    <div className="flex items-center gap-4 mt-4">
      <div className={cn(
        "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
        currentStep === 1 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
      )}>
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
          currentStep === 1 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
        )}>
          1
        </div>
        Informations générales
      </div>
      <ArrowRight className="h-4 w-4 text-gray-400" />
      <div className={cn(
        "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
        currentStep === 2 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
      )}>
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
          currentStep === 2 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
        )}>
          2
        </div>
        Rapport détaillé
      </div>
    </div>
  </DialogHeader>
);

// Composant pour rendre un champ personnalisé
interface CustomFieldRendererProps {
  field: CustomField;
  onUpdate: (updates: Partial<CustomField>) => void;
  onRemove: () => void;
}

const CustomFieldRenderer: React.FC<CustomFieldRendererProps> = ({ field, onUpdate, onRemove }) => {
  const renderFieldInput = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={field.value as string}
            onChange={(e) => onUpdate({ value: e.target.value })}
            placeholder={`Saisir ${field.label.toLowerCase()}...`}
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={field.value as string}
            onChange={(e) => onUpdate({ value: e.target.value })}
            placeholder={`Saisir ${field.label.toLowerCase()}...`}
            rows={3}
          />
        );
      case 'checkbox':
        return (
          <Checkbox
            checked={field.value as boolean}
            onCheckedChange={(checked) => onUpdate({ value: checked })}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={field.value as number}
            onChange={(e) => onUpdate({ value: parseFloat(e.target.value) || 0 })}
            placeholder={`Saisir ${field.label.toLowerCase()}...`}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={field.value as string}
            onChange={(e) => onUpdate({ value: e.target.value })}
          />
        );
      case 'select':
        return (
          <Select
            value={field.value as string}
            onValueChange={(value: string) => onUpdate({ value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Sélectionner ${field.label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="font-medium bg-transparent border-none p-0 h-auto focus-visible:ring-0"
            placeholder="Nom du champ"
          />
          <Badge variant="outline" className="text-xs">
            {field.type}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div>
        {renderFieldInput()}
      </div>
    </div>
  );
};

interface ModernEditTaskDialogProps {
  readonly task: Task | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

interface CustomField {
  id: string;
  type: 'text' | 'textarea' | 'checkbox' | 'select' | 'date' | 'number';
  label: string;
  value: string | boolean | number | Date;
  required?: boolean;
  options?: string[]; // Pour les select
}

interface EditTaskFormData {
  title: string;
  description: string;
  domainId: string;
  reportType: ReportType;
  reportCategory: string;
  customFields: CustomField[];
}

export const ModernEditTaskDialog: React.FC<ModernEditTaskDialogProps> = ({
  task,
  open,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();
  
  // Récupérer l'utilisateur connecté
  const { user } = useAuthStore();
  
  // Vérification des permissions - Seul le propriétaire peut éditer (même les admins)
  const canEditTask = (taskToEdit: Task | null) => {
    if (!taskToEdit || !user) return false;
    
    // Seul le propriétaire peut éditer (pas d'exception pour les admins)
    const isOwner = taskToEdit.userId === user.id;
    
    // Seules les tâches en DRAFT peuvent être éditées
    const isDraft = taskToEdit.status === 'DRAFT';
    
    return isOwner && isDraft;
  };
  
  const hasEditPermission = canEditTask(task);
  
  const [formData, setFormData] = useState<EditTaskFormData>({
    title: '',
    description: '',
    domainId: '',
    reportType: 'STANDARD',
    reportCategory: '',
    customFields: [],
  });

  const [domains, setDomains] = useState<readonly Domain[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [addDetailedReport, setAddDetailedReport] = useState(false);

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
      const reportContent = task.report?.content as Record<string, unknown> ?? {};
      const hasReport = task.report && Object.keys(reportContent).length > 0;
      
      // Convertir TOUS les champs du rapport en champs dynamiques
      const customFields: CustomField[] = [];
      
      // Mapping des champs standards avec leurs labels
      const standardFieldsMapping: Record<string, { label: string; type: CustomField['type'] }> = {
        objectives: { label: 'Objectifs', type: 'textarea' },
        results: { label: 'Résultats obtenus', type: 'textarea' },
        difficulties: { label: 'Difficultés rencontrées', type: 'textarea' },
        nextSteps: { label: 'Prochaines étapes', type: 'textarea' },
        timeSpent: { label: 'Temps passé', type: 'text' },
        resources: { label: 'Ressources utilisées', type: 'text' },
      };
      
      // Convertir tous les champs du reportContent (sauf 'category')
      Object.entries(reportContent).forEach(([key, value]) => {
        if (key === 'category') return; // Skip category car c'est géré séparément
        if (key.endsWith('_label')) return; // Skip les labels sauvegardés
        
        // Déterminer le type de champ
        let fieldType: CustomField['type'] = 'text';
        let fieldLabel: string;
        
        // Utiliser le mapping standard si disponible
        if (standardFieldsMapping[key]) {
          fieldType = standardFieldsMapping[key].type;
          fieldLabel = standardFieldsMapping[key].label;
        } else {
          // Pour les champs personnalisés, essayer de deviner le type
          if (typeof value === 'boolean') {
            fieldType = 'checkbox';
          } else if (typeof value === 'number') {
            fieldType = 'number';
          } else if (typeof value === 'string' && value.length > 100) {
            fieldType = 'textarea';
          }
          
          // Vérifier s'il y a un label sauvegardé
          const labelKey = `${key}_label`;
          if (reportContent[labelKey]) {
            fieldLabel = reportContent[labelKey] as string;
          } else {
            // Formatter le nom du champ pour l'affichage
            fieldLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
          }
        }
        
        customFields.push({
          id: key,
          type: fieldType,
          label: fieldLabel,
          value: value as string | boolean | number,
        });
      });
      
      setFormData({
        title: task.title,
        description: task.description ?? '',
        domainId: task.domainId,
        reportType: task.report?.type ?? 'STANDARD',
        reportCategory: reportContent.category as string ?? '',
        customFields,
      });
      setAddDetailedReport(Boolean(hasReport));
      setCurrentStep(1);
    }
  }, [task]);

  // Fonction de validation des données
  const validateFormData = (data: EditTaskFormData) => {
    if (!data.title.trim()) {
      throw new Error('Le titre est obligatoire');
    }
    
    if (!data.domainId || data.domainId.trim() === '' || data.domainId === 'no-domains') {
      throw new Error('Le domaine est obligatoire');
    }
    
    const domainExists = domains.find(d => d.id === data.domainId);
    if (!domainExists) {
      throw new Error('Le domaine sélectionné n\'existe pas');
    }
  };

  // Fonction de construction du rapport
  const buildReportData = (data: EditTaskFormData) => {
    if (!addDetailedReport) {
      return {
        reportContent: undefined,
        reportType: undefined,
        reportCategory: undefined,
      };
    }

    const reportContent: Record<string, unknown> = {};
    
    if (data.reportCategory.trim()) reportContent.category = data.reportCategory.trim();
    
    // Convertir les champs dynamiques en contenu de rapport
    // On sauvegarde à la fois l'ID et le label pour une meilleure compatibilité
    data.customFields.forEach(field => {
      if (field.value !== '' && field.value !== false && field.value !== null && field.value !== undefined) {
        // Sauvegarder avec l'ID original pour la compatibilité
        reportContent[field.id] = field.value;
        
        // Sauvegarder aussi avec le label pour l'affichage
        if (field.label && field.label !== field.id) {
          reportContent[`${field.id}_label`] = field.label;
        }
      }
    });
    
    // Si aucun contenu, pas de rapport
    if (Object.keys(reportContent).length === 0) {
      return {
        reportContent: undefined,
        reportType: undefined,
        reportCategory: undefined,
      };
    }

    console.log('Rapport construit:', reportContent); // Debug

    return {
      reportContent,
      reportType: data.reportType,
      reportCategory: data.reportCategory.trim() || undefined,
    };
  };

  const updateTaskMutation = useMutation({
    mutationFn: async (data: EditTaskFormData) => {
      if (!task) throw new Error('No task to update');
      
      validateFormData(data);
      const { reportContent, reportType, reportCategory } = buildReportData(data);

      const updateData: UpdateTaskInput = {
        title: data.title.trim(),
        description: data.description.trim() || undefined,
        domainId: data.domainId,
        reportType,
        reportCategory,
        reportContent,
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

  // Fonctions pour gérer les champs dynamiques
  const addCustomField = (type: CustomField['type']) => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      type,
      label: `Nouveau champ ${type}`,
      value: type === 'checkbox' ? false : '',
    };
    
    setFormData(prev => ({
      ...prev,
      customFields: [...prev.customFields, newField]
    }));
  };

  const updateCustomField = (fieldId: string, updates: Partial<CustomField>) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const removeCustomField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.filter(field => field.id !== fieldId)
    }));
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

  const nextStep = () => {
    if (currentStep < 2) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceedToStep2 = formData.title.trim() && formData.domainId && formData.domainId !== 'no-domains';

  // Fonction pour déterminer quel bouton afficher
  const renderActionButton = () => {
    if (currentStep === 1) {
      return addDetailedReport ? (
        <NextButton 
          onClick={nextStep} 
          disabled={!canProceedToStep2} 
        />
      ) : (
        <SaveButton 
          label="Enregistrer les modifications"
          disabled={updateTaskMutation.isPending || !formData.title.trim()}
          isPending={updateTaskMutation.isPending}
        />
      );
    }
    return (
      <SaveButton 
        label="Finaliser le rapport"
        disabled={updateTaskMutation.isPending || !formData.title.trim()}
        isPending={updateTaskMutation.isPending}
      />
    );
  };

  if (!task) return null;

  // Si l'utilisateur n'a pas les permissions, afficher un message d'erreur
  if (!hasEditPermission) {
    const getErrorMessage = () => {
      if (!task || !user) return "Erreur d'authentification";
      
      const isOwner = task.userId === user.id;
      const isDraft = task.status === 'DRAFT';
      
      if (!isDraft) {
        return `Cette tâche est en statut "${task.status}" et ne peut plus être modifiée. Seules les tâches en brouillon peuvent être éditées.`;
      }
      
      if (!isOwner) {
        return "Seul le créateur de la tâche peut la modifier. Cette tâche appartient à un autre utilisateur.";
      }
      
      return "Vous n'avez pas les permissions nécessaires pour éditer cette tâche.";
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X className="h-5 w-5" />
              Accès refusé
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Vous ne pouvez pas éditer cette tâche
            </h3>
            <p className="text-gray-600 mb-6">
              {getErrorMessage()}
            </p>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {task && (
          <DialogHeaderContent 
            task={task}
            currentStep={currentStep}
            onClose={() => onOpenChange(false)}
            getStatusColor={getStatusColor}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Informations de base */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informations de base
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Titre */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre de la tâche *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Décrivez brièvement la tâche..."
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Décrivez la tâche en détail..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Domaine */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Domaine d&apos;activité
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* Option rapport détaillé */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="addDetailedReport"
                      checked={addDetailedReport}
                      onCheckedChange={setAddDetailedReport}
                    />
                    <Label htmlFor="addDetailedReport" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Ajouter un rapport détaillé
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cochez cette case si votre projet nécessite un rapport spécifique (terrain, call center, formation, etc.).
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Configuration du rapport */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Configuration du rapport
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                </CardContent>
              </Card>

              {/* Champs personnalisés du rapport */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Champs du rapport
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Liste des champs personnalisés */}
                  {formData.customFields.length > 0 ? (
                    <div className="space-y-4">
                      {formData.customFields.map((field) => (
                        <CustomFieldRenderer
                          key={field.id}
                          field={field}
                          onUpdate={(updates) => updateCustomField(field.id, updates)}
                          onRemove={() => removeCustomField(field.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun champ personnalisé ajouté</p>
                      <p>Cliquez sur &quot;Ajouter un champ&quot; pour commencer</p>
                      <p className="text-sm">Les champs personnalisés sont des champs qui ne sont pas inclus par défaut dans le rapport.</p>
                    </div>
                  )}

                  {/* Boutons pour ajouter des champs */}
                  <div className="border-t pt-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCustomField('text')}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Texte
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCustomField('textarea')}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Zone de texte
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCustomField('checkbox')}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Case à cocher
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCustomField('number')}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Nombre
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCustomField('date')}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Date
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {currentStep === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={updateTaskMutation.isPending}
                >
                  Retour
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateTaskMutation.isPending}
              >
                Annuler
              </Button>
              
              {renderActionButton()}
            </div>
          </div>
          
          {/* Step indicator */}
          {addDetailedReport && (
            <div className="text-center text-sm text-muted-foreground">
              Étape {currentStep} / 2
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
