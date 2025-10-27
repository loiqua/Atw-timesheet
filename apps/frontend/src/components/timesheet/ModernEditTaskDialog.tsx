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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Save, 
  X, 
  ArrowRight,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateTask, listDomains, type Domain } from '@/features/timesheet/api';
import type { Task, UpdateTaskInput, ReportType } from '@/features/timesheet/types';
import { useAuthStore } from '@/lib/auth-store';
import { reportTemplates } from './report-templates';

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

// Composant LabeledField pour les champs prédéfinis
interface LabeledFieldProps {
  readonly id: string;
  readonly label: string;
  readonly type?: "text" | "number";
  readonly value: string | number;
  readonly onChange: (fieldId: string, value: string | number) => void;
  readonly removable?: boolean;
  readonly onRemove?: () => void;
}

const LabeledField: React.FC<LabeledFieldProps> = ({ 
  id, 
  label, 
  type = "text", 
  value,
  onChange, 
  removable, 
  onRemove 
}) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {removable && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            className="h-6 w-6 p-0"
            aria-label={`Retirer ${label}`} 
            onClick={onRemove}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => {
          const newValue = type === "number" ? Number(e.target.value || 0) : e.target.value;
          onChange(id, newValue);
        }}
      />
    </div>
  );
};

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
            onChange={(e) => onUpdate({ value: Number.parseFloat(e.target.value) || 0 })}
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
  value: string | boolean | number;
  required?: boolean;
  options?: string[]; // Pour les select
}

const reportCategories = [
  { key: "Direction", label: "Direction", icon: "👔", subtitle: "Réunions stratégiques, décisions" },
  { key: "Studies", label: "Études et Conseil", icon: "📊", subtitle: "Études marketing, analyses" },
  { key: "IT", label: "Informatique", icon: "💻", subtitle: "Maintenance, développement" },
  { key: "Finance", label: "Comptabilité et Finance", icon: "💰", subtitle: "Factures, paie, banque" },
  { key: "Quality", label: "Qualité et Statistiques", icon: "✅", subtitle: "Audit, contrôle données" },
  { key: "Field", label: "Terrain et Enquêtes", icon: "🚶", subtitle: "Collecte de données terrain" },
  { key: "Admin", label: "Administration et Support", icon: "📋", subtitle: "Logistique, secrétariat" },
  { key: "Custom", label: "Personnalisé", icon: "✨", subtitle: "Créez vos propres champs" },
] as const;

interface EditTaskFormData {
  projectType: 'FIELD' | 'INTERNAL' | 'CLIENT';
  title: string;
  description: string;
  domainId: string;
  date: string;
  startTime: string;
  endTime: string;
  reportType: ReportType;
  reportCategory: string;
  customCategoryName: string;
  reportFields: Record<string, string | number>;
  customFields: CustomField[];
  comments: string;
}

// Champs prédéfinis connus (ceux du wizard et des templates)
const KNOWN_FIELDS = new Set([
  'firstName', 'lastName', 'category', 'projectType', 'customCategoryName', 'comments',
  // Direction
  'meetingType', 'meetingDate', 'participants', 'decisions', 'actions', 'deadline', 'budget', 'status',
  // Studies
  'studyType', 'clientName', 'startDate', 'endDate', 'methodology', 'sampleSize', 'zones', 'progress', 'deliverables', 'observations',
  // IT
  'interventionType', 'hardware', 'software', 'ticketNumber', 'priority', 'interventionDate', 'duration', 'problem', 'solution',
  // Finance
  'operationType', 'documentNumber', 'operationDate', 'amount', 'beneficiary', 'paymentMethod', 'bankAccount', 'project', 'attachments',
  // Quality
  'activityType', 'controlDate', 'questionnairesChecked', 'errorRate', 'nonConformities', 'correctiveActions', 'validationStatus', 'correctionDeadline', 'responsible',
  // Field
  'surveyType', 'studyName', 'collectionDate', 'completedQuestionnaires', 'refusals', 'responseRate', 'locations', 'supervisor', 'difficulties', 'equipment', 'missionCost',
  // Admin
  'activityDate', 'requester', 'taskDescription', 'materials', 'vehicle', 'mileage', 'cost', 'documentsProcessed'
]);

const EXCLUDED_FIELDS = new Set(['category', 'projectType', 'customCategoryName', 'comments']);

// Helper pour déterminer le type de champ personnalisé
const inferCustomFieldType = (value: unknown): CustomField['type'] => {
  if (typeof value === 'boolean') return 'checkbox';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string' && value.length > 100) return 'textarea';
  return 'text';
};

// Helper pour formater le label d'un champ
const formatFieldLabel = (key: string): string => {
  return key.charAt(0).toUpperCase() + key.slice(1);
};

// Helper pour parser les champs du rapport
const parseReportFields = (
  reportContent: Record<string, unknown>
): { reportFields: Record<string, string | number>; customFields: CustomField[] } => {
  const reportFields: Record<string, string | number> = {};
  const customFields: CustomField[] = [];

  for (const [key, value] of Object.entries(reportContent)) {
    if (key.endsWith('_label')) continue;

    if (KNOWN_FIELDS.has(key)) {
      if (!EXCLUDED_FIELDS.has(key)) {
        reportFields[key] = value as string | number;
      }
    } else {
      const fieldType = inferCustomFieldType(value);
      const labelKey = `${key}_label`;
      const fieldLabel = reportContent[labelKey] as string ?? formatFieldLabel(key);

      customFields.push({
        id: key,
        type: fieldType,
        label: fieldLabel,
        value: value as string | boolean | number,
      });
    }
  }

  return { reportFields, customFields };
};

// Helper pour vérifier si une valeur est vide
const isEmptyValue = (value: unknown): boolean => {
  return value === '' || value === false || value === null || value === undefined;
};

// Helper pour ajouter la catégorie au rapport
const addCategoryToReport = (
  reportContent: Record<string, unknown>,
  category: string | null,
  customCategoryName: string
): void => {
  if (category === "Custom" && customCategoryName.trim()) {
    reportContent.category = customCategoryName.trim();
    reportContent.customCategoryName = customCategoryName.trim();
  } else if (category) {
    reportContent.category = category;
  }
};

// Helper pour ajouter les champs prédéfinis au rapport
const addReportFieldsToReport = (
  reportContent: Record<string, unknown>,
  reportFields: Record<string, string | number>
): void => {
  for (const [key, value] of Object.entries(reportFields)) {
    if (!isEmptyValue(value)) {
      reportContent[key] = value;
    }
  }
};

// Helper pour ajouter les champs personnalisés au rapport
const addCustomFieldsToReport = (
  reportContent: Record<string, unknown>,
  customFields: CustomField[]
): void => {
  for (const field of customFields) {
    if (!isEmptyValue(field.value)) {
      reportContent[field.id] = field.value;
      if (field.label && field.label !== field.id) {
        reportContent[`${field.id}_label`] = field.label;
      }
    }
  }
};

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
    projectType: 'INTERNAL',
    title: '',
    description: '',
    domainId: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '08:00',
    endTime: '17:00',
    reportType: 'STANDARD',
    reportCategory: '',
    customCategoryName: '',
    reportFields: {},
    customFields: [],
    comments: '',
  });

  const [domains, setDomains] = useState<readonly Domain[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [addDetailedReport, setAddDetailedReport] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(new Set());

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
    if (!task) return;

    const reportContent = task.report?.content as Record<string, unknown> ?? {};
    const hasReport = task.report && Object.keys(reportContent).length > 0;
    const savedCategory = reportContent.category as string ?? null;
    
    // Parser les champs du rapport
    const { reportFields, customFields } = parseReportFields(reportContent);
    
    setFormData({
      projectType: (reportContent.projectType as 'FIELD' | 'INTERNAL' | 'CLIENT') ?? 'INTERNAL',
      title: task.title,
      description: task.description ?? '',
      domainId: task.domainId,
      date: task.date ? new Date(task.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      startTime: task.startTime ?? '08:00',
      endTime: task.endTime ?? '17:00',
      reportType: task.report?.type ?? 'STANDARD',
      reportCategory: savedCategory ?? '',
      customCategoryName: reportContent.customCategoryName as string ?? '',
      reportFields,
      customFields,
      comments: reportContent.comments as string ?? '',
    });
    setCategory(savedCategory);
    setAddDetailedReport(Boolean(hasReport));
    setCurrentStep(1);
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
  const buildReportData = (data: EditTaskFormData): {
    reportContent: Record<string, unknown> | undefined;
    reportType: ReportType | undefined;
    reportCategory: string | undefined;
  } => {
    if (!addDetailedReport || !category) {
      return {
        reportContent: undefined,
        reportType: undefined,
        reportCategory: undefined,
      };
    }

    const reportContent: Record<string, unknown> = {};
    
    // Ajouter tous les champs au rapport
    addCategoryToReport(reportContent, category, data.customCategoryName);
    addReportFieldsToReport(reportContent, data.reportFields);
    addCustomFieldsToReport(reportContent, data.customFields);
    
    // Commentaires
    if (data.comments.trim()) {
      reportContent.comments = data.comments.trim();
    }
    
    // Si aucun contenu, pas de rapport
    if (Object.keys(reportContent).length === 0) {
      return {
        reportContent: undefined,
        reportType: undefined,
        reportCategory: undefined,
      };
    }

    return {
      reportContent,
      reportType: (category === "Custom" ? "CUSTOM" : "STANDARD") as ReportType,
      reportCategory: category === "Custom" && data.customCategoryName.trim() 
        ? data.customCategoryName.trim() 
        : category,
    };
  };

  const updateTaskMutation = useMutation({
    mutationFn: async (data: EditTaskFormData) => {
      if (!task) throw new Error('No task to update');
      
      validateFormData(data);
      const { reportContent, reportType, reportCategory } = buildReportData(data);

      // Ajouter projectType au reportContent si un rapport est présent
      if (reportContent && typeof reportContent === 'object') {
        reportContent.projectType = data.projectType;
      }

      const updateData: UpdateTaskInput = {
        title: data.title.trim(),
        description: data.description.trim() || undefined,
        domainId: data.domainId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
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

  // Fonction pour rendre les options du select de domaine
  const renderDomainOptions = () => {
    if (isLoadingData) {
      return (
        <SelectItem value="loading" disabled>
          Chargement des domaines...
        </SelectItem>
      );
    }
    
    if (domains.length === 0) {
      return (
        <SelectItem value="no-domains" disabled>
          Aucun domaine disponible
        </SelectItem>
      );
    }
    
    return domains.map((d) => (
      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
    ));
  };

  const updateReportField = (fieldId: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      reportFields: {
        ...prev.reportFields,
        [fieldId]: value
      }
    }));
  };

  const removeTemplateField = (fieldId: string) => {
    setHiddenFields((s) => new Set([...s, fieldId]));
    setFormData(prev => {
      const next = { ...prev.reportFields };
      delete next[fieldId];
      return { ...prev, reportFields: next };
    });
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
              {/* Type de projet */}
              <fieldset className="space-y-4">
                <legend className="text-base font-semibold text-gray-900 dark:text-white mb-4">Type de projet</legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['FIELD', 'INTERNAL', 'CLIENT'] as const).map((t) => {
                    const labels = {
                      FIELD: { name: "Terrain", icon: "🏞️", desc: "Travail sur le terrain" },
                      INTERNAL: { name: "Interne", icon: "🏢", desc: "Projet interne" },
                      CLIENT: { name: "Client", icon: "🤝", desc: "Mission client" }
                    };
                    const isSelected = formData.projectType === t;
                    
                    return (
                      <label 
                        key={t} 
                        className={`
                          relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }
                        `}
                      >
                        <input 
                          type="radio" 
                          value={t} 
                          checked={formData.projectType === t}
                          onChange={(e) => handleInputChange('projectType', e.target.value)}
                          className="sr-only"
                        />
                        <div className="text-2xl mb-2">{labels[t].icon}</div>
                        <div className={`font-medium text-sm ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                          {labels[t].name}
                        </div>
                        <div className={`text-xs text-center mt-1 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {labels[t].desc}
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Domaine */}
              <div className="space-y-3">
                <Label htmlFor="domain" className="text-base font-semibold text-gray-900 dark:text-white">
                  Domaine d&apos;activité
                </Label>
                <div className="relative">
                  <Select
                    value={formData.domainId}
                    onValueChange={(value: string) => handleInputChange('domainId', value)}
                    disabled={isLoadingData}
                  >
                    <SelectTrigger id="domain">
                      <SelectValue placeholder="Sélectionner un domaine..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-fit">
                      {renderDomainOptions()}
                    </SelectContent>
                  </Select>
                  {formData.domainId && !isLoadingData && domains.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Domaine actuel : {domains.find(d => d.id === formData.domainId)?.name ?? 'Chargement...'}
                    </p>
                  )}
                </div>
              </div>

              {/* Titre */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="title">Titre du projet</Label>
                <Input
                  id="title"
                  placeholder="Nom du projet"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="desc">Description de la tâche (optionnel)</Label>
                <Textarea 
                  id="desc" 
                  className="min-h-24" 
                  placeholder="Résumé rapide du travail effectué (optionnel)..." 
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>

              {/* Horaires de travail */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-900 dark:text-white">
                  Horaires de travail
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="startTime">🕐 Heure de début</Label>
                    <Input
                      id="startTime"
                      type="time"
                      min="05:00"
                      max="21:59"
                      step={60}
                      placeholder="05:00"
                      className="border-2 focus:border-blue-500"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                    />
                    <span className="text-xs text-gray-500">Entre 05h00 et 21h59</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="endTime">🕕 Heure de fin</Label>
                    <Input
                      id="endTime"
                      type="time"
                      min="05:01"
                      max="22:00"
                      step={60}
                      placeholder="22:00"
                      className="border-2 focus:border-blue-500"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                    />
                    <span className="text-xs text-gray-500">Entre 05h01 et 22h00</span>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 text-sm">ℹ️</span>
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Règles des heures de travail :</p>
                      <ul className="space-y-1 text-xs">
                        <li>• <strong>Début :</strong> Entre 05h00 et 21h59</li>
                        <li>• <strong>Fin :</strong> Entre 05h01 et 22h00</li>
                        <li>• <strong>Durée minimale :</strong> 5 minutes</li>
                        <li>• <strong>Durée maximale :</strong> 10 heures</li>
                        <li>• <strong>Exemple valide :</strong> 07h30-12h00</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option rapport détaillé */}
              <div>
                <label className="flex items-center gap-2">
                  <Checkbox
                    id="addDetailedReport"
                    checked={addDetailedReport}
                    onCheckedChange={setAddDetailedReport}
                  />
                  <span>Ajouter un rapport détaillé</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1">Cochez cette case si votre projet nécessite un rapport spécifique (terrain, call center, formation, etc.).</p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Sélection de la catégorie de rapport */}
              <div>
                <div className="text-sm font-medium mb-2">Sélectionner un type de rapport</div>
                <div className="grid grid-cols-2 gap-2">
                  {reportCategories.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setCategory(c.key)}
                      className={`rounded-md border p-3 text-left transition-all ${
                        category === c.key 
                          ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                      aria-pressed={category === c.key}
                      aria-label={`Sélectionner ${c.label}`}
                    >
                      <div className="text-2xl">{c.icon}</div>
                      <div className="font-medium">{c.label}</div>
                      <div className="text-muted-foreground text-xs">{c.subtitle}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Champ pour nom personnalisé quand Custom est sélectionné */}
              {category === "Custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customCategoryName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    ✨ Nom de votre catégorie personnalisée
                  </Label>
                  <Input
                    id="customCategoryName"
                    value={formData.customCategoryName}
                    onChange={(e) => handleInputChange('customCategoryName', e.target.value)}
                    placeholder="ex: Réunion client, Formation spécialisée, Audit terrain..."
                    className="w-full"
                  />
                </div>
              )}

              {/* Champs par catégorie */}
              {category && (
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium">Détails</div>
                  
                  {/* Champs communs */}
                  {!hiddenFields.has("firstName") && (
                    <LabeledField 
                      id="firstName" 
                      label="Prénom" 
                      value={formData.reportFields.firstName as string ?? ''}
                      onChange={updateReportField} 
                      removable 
                      onRemove={() => removeTemplateField("firstName")} 
                    />
                  )}
                  {!hiddenFields.has("lastName") && (
                    <LabeledField 
                      id="lastName" 
                      label="Nom" 
                      value={formData.reportFields.lastName as string ?? ''}
                      onChange={updateReportField} 
                      removable 
                      onRemove={() => removeTemplateField("lastName")} 
                    />
                  )}

                  {/* Champs par catégorie (templates dynamiques) */}
                  {category && category !== "Custom" && reportTemplates[category as keyof typeof reportTemplates] && (
                    <div className="space-y-3">
                      {reportTemplates[category as keyof typeof reportTemplates].map((template) => {
                        if (hiddenFields.has(template.id)) return null;
                        
                        const value = formData.reportFields[template.id] ?? (template.type === 'number' ? 0 : '');
                        
                        // Champs de type select
                        if (template.type === 'select' && template.options) {
                          return (
                            <div key={template.id} className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <Label htmlFor={template.id}>{template.label}</Label>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  aria-label={`Retirer ${template.label}`} 
                                  onClick={() => removeTemplateField(template.id)}
                                >
                                  <X className="size-4" />
                                </Button>
                              </div>
                              <Select
                                value={value as string}
                                onValueChange={(val: string) => updateReportField(template.id, val)}
                              >
                                <SelectTrigger id={template.id}>
                                  <SelectValue placeholder={`Sélectionner ${template.label.toLowerCase()}...`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {template.options.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        }
                        
                        // Champs de type textarea
                        if (template.type === 'textarea') {
                          return (
                            <div key={template.id} className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <Label htmlFor={template.id}>{template.label}</Label>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  aria-label={`Retirer ${template.label}`} 
                                  onClick={() => removeTemplateField(template.id)}
                                >
                                  <X className="size-4" />
                                </Button>
                              </div>
                              <Textarea
                                id={template.id}
                                value={value as string}
                                onChange={(e) => updateReportField(template.id, e.target.value)}
                                rows={3}
                                placeholder={`Saisir ${template.label.toLowerCase()}...`}
                              />
                            </div>
                          );
                        }
                        
                        // Champs de type text, number, date (LabeledField)
                        if (template.type === 'date') {
                          return (
                            <div key={template.id} className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <Label htmlFor={template.id}>{template.label}</Label>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  aria-label={`Retirer ${template.label}`} 
                                  onClick={() => removeTemplateField(template.id)}
                                >
                                  <X className="size-4" />
                                </Button>
                              </div>
                              <Input
                                id={template.id}
                                type="date"
                                value={value as string}
                                onChange={(e) => updateReportField(template.id, e.target.value)}
                              />
                            </div>
                          );
                        }
                        
                        // Champs de type text et number
                        return (
                          <LabeledField 
                            key={template.id}
                            id={template.id} 
                            label={template.label} 
                            type={template.type === 'number' ? 'number' : 'text'}
                            value={value}
                            onChange={updateReportField} 
                            removable 
                            onRemove={() => removeTemplateField(template.id)} 
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Champs personnalisés améliorés */}
                  <div className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">Champs personnalisés</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Créez vos propres champs avec différents types</div>
                      </div>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={() => addCustomField('text')} 
                        className="gap-1 bg-white dark:bg-gray-700"
                      >
                        <Plus className="size-4" /> Ajouter un champ
                      </Button>
                    </div>
                    
                    {formData.customFields.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <div className="text-4xl mb-2">📝</div>
                        <div className="text-sm">Aucun champ personnalisé ajouté</div>
                        <div className="text-xs">Cliquez sur &ldquo;Ajouter un champ&rdquo; pour commencer</div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      {formData.customFields.map((f) => (
                        <CustomFieldRenderer
                          key={f.id}
                          field={f}
                          onUpdate={(updates) => updateCustomField(f.id, updates)}
                          onRemove={() => removeCustomField(f.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Section Observations */}
              {category && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 text-sm">💬</span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Observations</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="comments" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      📝 Commentaires
                    </Label>
                    <Textarea
                      id="comments"
                      rows={4}
                      value={formData.comments}
                      onChange={(e) => handleInputChange('comments', e.target.value)}
                      className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Vos observations, remarques et commentaires..."
                    />
                  </div>
                </div>
              )}
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
