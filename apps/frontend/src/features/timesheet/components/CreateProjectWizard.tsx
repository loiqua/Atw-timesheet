"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectTrigger, 
  SelectContent, 
  SelectItem, 
  SelectValue 
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { OfflineStorageService } from "@/lib/offline-storage";
import type { CreateTaskInput } from "@/features/timesheet/types";
import { reportTemplates } from "@/components/timesheet/report-templates";
import { Textarea } from "@/components/ui/textarea";

interface Domain {
  id: string;
  name: string;
  slug: string;
}

type CustomField = { 
  id: string; 
  label: string; 
  type: 'text' | 'number' | 'checkbox' | 'textarea' | 'select';
  value: string | number | boolean;
  options?: string[]; // Pour les select
};

const step1Schema = z.object({
  projectType: z.enum(["FIELD", "INTERNAL", "CLIENT"]).default("INTERNAL"),
  domainId: z.string().min(1, "Domain is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  date: z.string().min(8, "Date is required"),
  // Nouveau système d'heures
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  // Ancien système (optionnel)
  durationMin: z.number().min(0, "Enter valid minutes").optional(),
  addDetailedReport: z.boolean().default(true),
}).refine((data) => {
  // Validation des heures cohérentes
  if (data.startTime && data.endTime) {
    const start = new Date(`2000-01-01T${data.startTime}`);
    const end = new Date(`2000-01-01T${data.endTime}`);
    return end > start;
  }
  return true;
}, {
  message: "L'heure de fin doit être postérieure à l'heure de début",
  path: ["endTime"],
}).refine((data) => {
  // 🔒 VALIDATION STRICTE: Heure de début entre 05h00 et 21h59
  if (data.startTime) {
    const [hours, minutes] = data.startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const minTime = 5 * 60; // 05h00 = 300 minutes
    const maxTime = 22 * 60 - 1; // 21h59 = 1319 minutes
    
    if (totalMinutes < minTime || totalMinutes > maxTime) {
      return false;
    }
  }
  return true;
}, {
  message: "🚫 Heure de début invalide ! Doit être entre 05h00 et 21h59",
  path: ["startTime"],
}).refine((data) => {
  // 🔒 VALIDATION STRICTE: Heure de fin entre 05h01 et 22h00
  if (data.endTime) {
    const [hours, minutes] = data.endTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const minTime = 5 * 60 + 1; // 05h01 = 301 minutes
    const maxTime = 22 * 60; // 22h00 = 1320 minutes
    
    if (totalMinutes < minTime || totalMinutes > maxTime) {
      return false;
    }
  }
  return true;
}, {
  message: "🚫 Heure de fin invalide ! Doit être entre 05h01 et 22h00",
  path: ["endTime"],
}).refine((data) => {
  // 🔒 VALIDATION: Durée minimale de 5 minutes
  if (data.startTime && data.endTime) {
    const start = new Date(`2000-01-01T${data.startTime}`);
    const end = new Date(`2000-01-01T${data.endTime}`);
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return diffMinutes >= 5;
  }
  return true;
}, {
  message: "⏰ Durée minimale : 5 minutes de travail",
  path: ["endTime"],
}).refine((data) => {
  // 🔒 VALIDATION: Durée maximale de 10 heures (8h-18h = 10h max)
  if (data.startTime && data.endTime) {
    const start = new Date(`2000-01-01T${data.startTime}`);
    const end = new Date(`2000-01-01T${data.endTime}`);
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diffHours <= 10;
  }
  return true;
}, {
  message: "🚫 Durée maximale : 10 heures par jour",
  path: ["endTime"],
});

type Step1Values = z.infer<typeof step1Schema>;

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


export function CreateProjectWizard({
  domains,
  onCancel,
  onCreate,
}: {
  readonly domains: readonly Domain[];
  readonly onCancel: () => void;
  readonly onCreate: (data: CreateTaskInput) => Promise<void> | void;
}) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const form = useForm<Step1Values>({
    defaultValues: {
      projectType: "INTERNAL",
      domainId: domains[0]?.id ?? "",
      title: "Nouvelle tâche",
      description: "",
      date: today,
      startTime: "08:00", // Valeur par défaut
      endTime: "17:00",   // Valeur par défaut
      addDetailedReport: false,
    },
    mode: "onChange", // Validation en temps réel
  });
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<string | null>(null);
  const [customCategoryName, setCustomCategoryName] = useState<string>("");
  const [reportFields, setReportFields] = useState<Record<string, string | number>>({});
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(new Set());
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [comments, setComments] = useState<string>("");

  // Fonctions de sauvegarde hors ligne
  const saveOffline = () => {
    const v = form.getValues();

    try {
      const taskId = OfflineStorageService.saveTask({
        title: v.title,
        description: v.description ?? undefined,
        domainId: v.domainId,
        date: v.date,
        durationMin: Number(v.durationMin),
        projectType: v.projectType,
        category: category === "Custom" && customCategoryName ? customCategoryName : category ?? undefined,
        reportFields,
        customFields,
        comments
      });
      
      alert(`✅ Tâche sauvegardée hors ligne (ID: ${taskId.slice(0, 8)}...)`);
    } catch (error) {
      console.error('Erreur sauvegarde hors ligne:', error);
      alert('❌ Erreur lors de la sauvegarde hors ligne');
    }
  };

  const syncOffline = async () => {
    try {
      const createTaskWrapper = async (task: CreateTaskInput): Promise<void> => {
        await Promise.resolve(onCreate(task));
      };
      
      const result = await OfflineStorageService.syncTasks(createTaskWrapper);
      if (result.success > 0) {
        alert(`✅ ${result.success} tâche(s) synchronisée(s)`);
      }
      if (result.failed > 0) {
        alert(`❌ ${result.failed} tâche(s) ont échoué`);
      }
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      alert('❌ Erreur lors de la synchronisation');
    }
  };

  const getDefaultValueForType = (type: CustomField['type']): string | number | boolean => {
    switch (type) {
      case 'checkbox': return false;
      case 'number': return 0;
      default: return "";
    }
  };

  const addCustomField = () => {
    setCustomFields((prev) => [
      ...prev,
      {
        id: `cf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        label: "",
        type: "text" as const,
        value: "",
      },
    ]);
  };

  const updateCustomFieldLabel = (id: string, newLabel: string) => {
    setCustomFields((prev) => prev.map((f) => (f.id === id ? { ...f, label: newLabel } : f)));
  };
  
  const updateCustomFieldType = (id: string, newType: CustomField['type']) => {
    setCustomFields((prev) => prev.map((f) => (f.id === id ? { 
      ...f, 
      type: newType,
      value: getDefaultValueForType(newType)
    } : f)));
  };
  
  const updateCustomFieldValue = (id: string, newVal: string | number | boolean) => {
    setCustomFields((prev) => prev.map((f) => (f.id === id ? { ...f, value: newVal } : f)));
  };
  
  const updateReportField = (fieldId: string, value: string | number) => {
    setReportFields((prev) => ({
      ...prev,
      [fieldId]: value
    }));
  };
  
  const removeCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };
  const removeTemplateField = (fieldId: string) => {
    setHiddenFields((s) => new Set([...s, fieldId]));
    setReportFields((rf: Record<string, string | number>) => {
      const next: Record<string, string | number> = { ...rf };
      delete next[fieldId];
      return next;
    });
  };

  const toISODate = (d: string) => new Date(d).toISOString();

  const submitStep1 = async (values: Step1Values) => {
    try {
      console.log("🔍 Données du formulaire:", values);
      
      // Validation avec le schéma Zod
      const validatedData = step1Schema.parse(values);
      console.log("✅ Validation Zod réussie:", validatedData);
      
      // Validation : on doit avoir les heures de début et de fin
      const hasStartTime = validatedData.startTime?.trim();
      const hasEndTime = validatedData.endTime?.trim();
      
      if (!hasStartTime || !hasEndTime) {
        alert("⚠️ Veuillez saisir les heures de début et de fin (obligatoires entre 05h et 22h).");
        return;
      }
      
      const payloadBase: CreateTaskInput = {
        domainId: validatedData.domainId,
        title: validatedData.title,
        description: validatedData.description ?? null,
        date: toISODate(validatedData.date),
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
      };
      
      console.log("🚀 Payload final:", payloadBase);
      
      if (validatedData.addDetailedReport) {
        console.log("📝 Passage à l'étape 2 (rapport détaillé)");
        setStep(2);
      } else {
        console.log("💾 Création directe de la tâche");
        await onCreate(payloadBase);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la soumission:", error);
      if (error instanceof Error) {
        alert(`🚫 Erreur de validation : ${error.message}`);
      } else {
        alert("🚫 Erreur inconnue lors de la création de la tâche");
      }
    }
  };

  const submitStep2 = async () => {
    const v = form.getValues();
    // Merge custom fields (only those with non-empty labels)
    const customObj = customFields.reduce<Record<string, unknown>>((acc, f) => {
      const key = f.label.trim();
      if (key) acc[key] = f.value;
      return acc;
    }, {});
    
    console.log("Debug - reportFields:", reportFields);
    console.log("Debug - customFields:", customFields);
    console.log("Debug - customObj:", customObj);
    
    const payload: CreateTaskInput = {
      domainId: v.domainId,
      title: v.title,
      description: v.description ?? null,
      date: toISODate(v.date),
      ...(v.startTime && { startTime: v.startTime }),
      ...(v.endTime && { endTime: v.endTime }),
      ...(v.durationMin && { durationMin: Number(v.durationMin) }),
      reportType: category === "Custom" ? "CUSTOM" : "STANDARD",
      reportCategory: category === "Custom" && customCategoryName ? customCategoryName : category ?? undefined,
      reportContent: {
        projectType: v.projectType,
        category: category === "Custom" && customCategoryName ? customCategoryName : category,
        customCategoryName: category === "Custom" ? customCategoryName : undefined,
        ...reportFields,
        ...customObj,
        // Ajouter les commentaires/observations
        ...(comments.trim() && { comments: comments.trim() }),
      },
    };
    
    console.log("Debug - Final payload.reportContent:", payload.reportContent);
    await onCreate(payload);
  };

  return (
    <div className="flex flex-col gap-6 max-h-full overflow-hidden" aria-live="polite">
      {step === 1 && (
        <div className="flex flex-col h-full">
          <form
            className="flex-1 overflow-y-auto space-y-6 pr-2"
            onSubmit={form.handleSubmit(submitStep1)}
            aria-label="Créer un projet — étape 1"
          >
          <fieldset className="space-y-4">
            <legend className="text-base font-semibold text-gray-900 dark:text-white mb-4">Type de projet</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["FIELD", "INTERNAL", "CLIENT"] as const).map((t) => {
                const labels = {
                  FIELD: { name: "Terrain", icon: "🏞️", desc: "Travail sur le terrain" },
                  INTERNAL: { name: "Interne", icon: "🏢", desc: "Projet interne" },
                  CLIENT: { name: "Client", icon: "🤝", desc: "Mission client" }
                };
                const isSelected = form.watch("projectType") === t;
                
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
                      {...form.register("projectType")}
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

          <div className="space-y-3">
            <Label htmlFor="domain" className="text-base font-semibold text-gray-900 dark:text-white">
              Domaine d&apos;activité
            </Label>
            <div className="relative">
              <Select
                value={form.watch("domainId")}
                onValueChange={(value: string) => form.setValue("domainId", value, { shouldValidate: true })}
              >
                <SelectTrigger id="domain" aria-invalid={!!form.formState.errors.domainId}>
                  <SelectValue placeholder="Sélectionner un domaine..." />
                </SelectTrigger>
                <SelectContent className="max-h-fit">
                  {domains.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" {...form.register("domainId")} value={form.watch("domainId")} />
            </div>
            {form.formState.errors.domainId && (
              <span id="domain-error" role="alert" className="text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {form.formState.errors.domainId.message as string}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="title">Titre du projet</Label>
            <Input
              id="title"
              placeholder="Nom du projet"
              aria-invalid={!!form.formState.errors.title}
              aria-describedby={form.formState.errors.title ? "title-error" : undefined}
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <span id="title-error" role="alert" className="text-sm text-red-600">
                {form.formState.errors.title.message as string}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="desc">Description de la tâche (optionnel)</Label>
            <textarea id="desc" className="min-h-24 rounded-md border px-2 py-1" placeholder="Résumé rapide du travail effectué (optionnel)..." {...form.register("description")} />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              aria-invalid={!!form.formState.errors.date}
              aria-describedby={form.formState.errors.date ? "date-error" : undefined}
              {...form.register("date")}
            />
            {form.formState.errors.date && (
              <span id="date-error" role="alert" className="text-sm text-red-600">
                {form.formState.errors.date.message as string}
              </span>
            )}
          </div>

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
                  aria-invalid={!!form.formState.errors.startTime}
                  aria-describedby={form.formState.errors.startTime ? "startTime-error" : undefined}
                  {...form.register("startTime")}
                />
                <span className="text-xs text-gray-500">Entre 05h00 et 21h59</span>
                {form.formState.errors.startTime && (
                  <span id="startTime-error" role="alert" className="text-sm text-red-600 font-medium">
                    {form.formState.errors.startTime.message as string}
                  </span>
                )}
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
                  aria-invalid={!!form.formState.errors.endTime}
                  aria-describedby={form.formState.errors.endTime ? "endTime-error" : undefined}
                  {...form.register("endTime")}
                />
                <span className="text-xs text-gray-500">Entre 05h01 et 22h00</span>
                {form.formState.errors.endTime && (
                  <span id="endTime-error" role="alert" className="text-sm text-red-600">
                    {form.formState.errors.endTime.message as string}
                  </span>
                )}
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

          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register("addDetailedReport")} />
              <span>Ajouter un rapport détaillé</span>
            </label>
            <p className="text-xs text-muted-foreground mt-1">Cochez cette case si votre projet nécessite un rapport spécifique (terrain, call center, formation, etc.).</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
            <Button type="submit" variant="accent" disabled={form.formState.isSubmitting}>
              {(() => {
                if (form.formState.isSubmitting) return "⏳ Création...";
                if (form.watch("addDetailedReport")) return "Suivant";
                return "Créer le projet";
              })()}
            </Button>
          </div>
        </form>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto space-y-6 pr-2" aria-label="Créer un projet — étape 2">
          <div>
            <div className="text-sm font-medium mb-2">Sélectionner un type de rapport</div>
            <div className="grid grid-cols-2 gap-2">
              {reportCategories.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={`rounded-md border p-3 text-left ${category === c.key ? "ring-2 ring-yellow-500" : ""}`}
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
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                placeholder="ex: Réunion client, Formation spécialisée, Audit terrain..."
                className="w-full"
              />
            </div>
          )}

          {/* Simple dynamic fields example; you can enrich per category */}
          {category && (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Détails</div>
              {/* Champs communs */}
              {!hiddenFields.has("firstName") && (
                <LabeledField id="firstName" label="Prénom" onChange={updateReportField} removable onRemove={() => removeTemplateField("firstName")} />
              )}
              {!hiddenFields.has("lastName") && (
                <LabeledField id="lastName" label="Nom" onChange={updateReportField} removable onRemove={() => removeTemplateField("lastName")} />
              )}

              {/* Champs par catégorie (templates dynamiques) */}
              {category && category !== "Custom" && reportTemplates[category as keyof typeof reportTemplates] && (
                <div className="space-y-3">
                  {reportTemplates[category as keyof typeof reportTemplates].map((template) => {
                    if (hiddenFields.has(template.id)) return null;
                    
                    const value = reportFields[template.id] ?? (template.type === 'number' ? 0 : '');
                    
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
                    
                    // Champs de type date
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
                  <Button type="button" size="sm" variant="outline" onClick={addCustomField} className="gap-1 bg-white dark:bg-gray-700">
                    <Plus className="size-4" /> Ajouter un champ
                  </Button>
                </div>
                
                {customFields.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">📝</div>
                    <div className="text-sm">Aucun champ personnalisé ajouté</div>
                    <div className="text-xs">Cliquez sur &ldquo;Ajouter un champ&rdquo; pour commencer</div>
                  </div>
                )}
                
                <div className="space-y-4">
                  {customFields.map((f) => (
                    <div key={f.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Nom du champ */}
                        <div className="space-y-2">
                          <Label htmlFor={`${f.id}_label`} className="text-sm font-medium">Nom du champ</Label>
                          <Input 
                            id={`${f.id}_label`} 
                            value={f.label} 
                            onChange={(e) => updateCustomFieldLabel(f.id, e.target.value)} 
                            placeholder="ex: Ville, Client, R&eacute;f&eacute;rence"
                            className="h-9"
                          />
                        </div>
                        
                        {/* Type de champ */}
                        <div className="space-y-2">
                          <Label htmlFor={`${f.id}_type`} className="text-sm font-medium">Type de champ</Label>
                          <select 
                            id={`${f.id}_type`}
                            value={f.type} 
                            onChange={(e) => updateCustomFieldType(f.id, e.target.value as CustomField['type'])}
                            className="h-9 w-full rounded-md border border-gray-200 dark:border-gray-600 px-3 bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="text">📝 Texte</option>
                            <option value="textarea">📄 Texte long</option>
                            <option value="number">🔢 Nombre</option>
                            <option value="checkbox">☑️ Case à cocher</option>
                            <option value="select">📋 Liste déroulante</option>
                          </select>
                        </div>
                        
                        {/* Valeur du champ */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`${f.id}_val`} className="text-sm font-medium">Valeur</Label>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeCustomField(f.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                          
                          {f.type === 'text' && (
                            <Input 
                              id={`${f.id}_val`} 
                              value={f.value as string} 
                              onChange={(e) => updateCustomFieldValue(f.id, e.target.value)} 
                              placeholder="Saisir la valeur"
                              className="h-9"
                            />
                          )}
                          
                          {f.type === 'textarea' && (
                            <textarea 
                              id={`${f.id}_val`} 
                              value={f.value as string} 
                              onChange={(e) => updateCustomFieldValue(f.id, e.target.value)} 
                              placeholder="Saisir le texte..."
                              className="w-full h-20 px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-white resize-none"
                            />
                          )}
                          
                          {f.type === 'number' && (
                            <Input 
                              id={`${f.id}_val`} 
                              type="number" 
                              value={f.value as number} 
                              onChange={(e) => updateCustomFieldValue(f.id, Number(e.target.value) || 0)} 
                              placeholder="0"
                              className="h-9"
                            />
                          )}
                          
                          {f.type === 'checkbox' && (
                            <div className="flex items-center space-x-2 h-9">
                              <input 
                                id={`${f.id}_val`} 
                                type="checkbox" 
                                checked={f.value as boolean} 
                                onChange={(e) => updateCustomFieldValue(f.id, e.target.checked)} 
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <Label htmlFor={`${f.id}_val`} className="text-sm text-gray-600 dark:text-gray-400">
                                {f.value ? 'Activé' : 'Désactivé'}
                              </Label>
                            </div>
                          )}
                          
                          {f.type === 'select' && (
                            <select 
                              id={`${f.id}_val`}
                              value={f.value as string} 
                              onChange={(e) => updateCustomFieldValue(f.id, e.target.value)}
                              className="h-9 w-full rounded-md border border-gray-200 dark:border-gray-600 px-3 bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                            >
                              <option value="">Sélectionner...</option>
                              <option value="option1">Option 1</option>
                              <option value="option2">Option 2</option>
                              <option value="option3">Option 3</option>
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          </div>
          
          {/* Section Observations - Affichée seulement si une catégorie est sélectionnée */}
          {category && (
            <div className="flex-shrink-0 space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              {/* Section Observations */}
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
                  <textarea
                    id="comments"
                    rows={4}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Vos observations, remarques et commentaires..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setStep(1)} className="order-3 sm:order-1">
              Retour
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
              {/* Bouton Sauvegarder (mode hors ligne) */}
              <Button 
                variant="outline" 
                onClick={saveOffline}
                className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="text-lg">💾</span>
                <span>Sauvegarder</span>
              </Button>
              
              {/* Bouton Synchroniser */}
              <Button 
                variant="outline"
                onClick={syncOffline}
                className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                <span className="text-lg">🔄</span>
                <span>Synchroniser</span>
              </Button>
              
              {/* Bouton Finaliser le rapport */}
              <Button 
                onClick={submitStep2} 
                disabled={!category} 
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <span className="text-lg">✅</span>
                <span>Finaliser le rapport</span>
              </Button>
            </div>
            
            <Button variant="outline" onClick={onCancel} className="order-2 sm:order-3 text-gray-600 dark:text-gray-400">
              Annuler
            </Button>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground">Étape {step} / 2</div>
    </div>
  );
}

function LabeledField({ id, label, type = "text", onChange, removable, onRemove }: Readonly<{ id: string; label: string; type?: "text" | "number"; onChange: (fieldId: string, value: string | number) => void; removable?: boolean; onRemove?: () => void }>) {
  const [val, setVal] = useState<string>("");
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {removable && (
          <Button type="button" variant="ghost" size="icon" aria-label={`Retirer ${label}`} onClick={onRemove}>
            <X className="size-4" />
          </Button>
        )}
      </div>
      <Input
        id={id}
        type={type}
        value={val}
        onChange={(e) => {
          const newValue = type === "number" ? Number(e.target.value || 0) : e.target.value;
          setVal(e.target.value);
          onChange(id, newValue);
        }}
      />
    </div>
  );
}
