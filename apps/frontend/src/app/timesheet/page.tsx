"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Download, Trash2, Check, X, RefreshCw, Filter, ChevronDown, ChevronUp, Edit, RotateCcw } from "lucide-react";

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadBase64File } from "@/lib/fetcher";
import { useAuthStore } from "@/lib/auth-store";
import {
  approveTask,
  createTask,
  deleteTask,
  getTaskPdfBase64,
  listDomains,
  listTasks,
  listUsers,
  rejectTask,
  requestTaskRevision,
  submitTask,
  type Domain,
} from "@/features/timesheet/api";
import type { CreateTaskInput, ListTasksQuery, Task, TaskStatus, Paginated } from "@/features/timesheet/types";
import { CreateProjectWizard } from "@/features/timesheet/components/CreateProjectWizard";
import { ModernEditTaskDialog } from "@/components/timesheet/ModernEditTaskDialog";

const statusBadge: Record<TaskStatus, { label: string; variant: "success" | "destructive" | "secondary" | "outline" | "default" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  SUBMITTED: { label: "Soumis", variant: "default" },
  APPROVED: { label: "Approuvé", variant: "success" },
  REJECTED: { label: "Rejeté", variant: "destructive" },
};
const statusVariantMap: Record<TaskStatus, "muted" | "warning" | "success" | "destructive"> = {
  DRAFT: "muted",
  SUBMITTED: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

export default function TimesheetPage() {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const role = me?.role ?? "EMPLOYEE";
  

  // filters
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TaskStatus | undefined>(
    // Pour les admin, statut SUBMITTED par défaut
    (role === "ADMIN" || role === "MANAGER") ? "SUBMITTED" : undefined
  );
  const [domainId, setDomainId] = useState<string | undefined>(undefined);
  const [userScope, setUserScope] = useState<"me" | "all" | "specific">("all");
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fonction pour gérer l'édition d'une tâche
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const isAdmin = role === "ADMIN";
  const isAdminOrManager = isAdmin || role === "MANAGER";

  const queryParams: ListTasksQuery = useMemo(() => {
    // Convertir les dates au format ISO si elles existent
    const formatDateToISO = (dateStr: string) => {
      if (!dateStr) return undefined;
      // Si c'est déjà au format YYYY-MM-DD, on garde tel quel
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      // Si c'est au format DD/MM/YYYY, on convertit
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return dateStr;
    };

    const baseParams = {
      title: title ?? undefined,
      status,
      domainId: domainId ?? undefined,
      dateFrom: formatDateToISO(dateFrom),
      dateTo: formatDateToISO(dateTo),
      page,
      pageSize,
    };

    let finalParams: ListTasksQuery = baseParams;
    
    if (isAdminOrManager) {
      if (userScope === "all") {
        finalParams = { ...baseParams, all: 'true' };
      } else if (userScope === "specific" && userId) {
        finalParams = { ...baseParams, userId };
      } else {
        // Par défaut, les admins voient toutes les tâches
        finalParams = { ...baseParams, all: 'true' };
      }
    }
    
    return finalParams;
  }, [title, status, domainId, dateFrom, dateTo, page, pageSize, isAdminOrManager, userScope, userId]);

  const { data: domains } = useQuery<readonly Domain[], Error>({
    queryKey: ["domains"],
    queryFn: listDomains,
    staleTime: 60_000,
  });

  const { data: users } = useQuery<readonly import("@/features/timesheet/api").UserSummary[], Error>({
    queryKey: ["users"],
    queryFn: listUsers,
    enabled: isAdminOrManager,
    staleTime: 60_000,
  });

  const { data, isLoading, isError, error, refetch } = useQuery<Paginated<Task>, Error>({
    queryKey: ["tasks", queryParams],
    queryFn: () => listTasks(queryParams),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false, // Évite les requêtes multiples
    retry: 1, // Limite les tentatives en cas d'erreur
  });

  const mutateSubmit = useMutation({
    mutationFn: (id: string) => {
      console.log('🚀 Soumission de la tâche:', id);
      return submitTask(id);
    },
    onSuccess: (data) => {
      console.log('✅ Tâche soumise avec succès:', data);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      console.error('❌ Erreur soumission:', error);
      alert('Erreur lors de la soumission de la tâche');
    },
  });
  const mutateApprove = useMutation({
    mutationFn: (id: string) => {
      console.log('🚀 Approbation de la tâche:', id);
      return approveTask(id);
    },
    onSuccess: (data) => {
      console.log('✅ Tâche approuvée avec succès:', data);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      console.error('❌ Erreur approbation:', error);
      alert('Erreur lors de l\'approbation de la tâche');
    },
  });
  const mutateReject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectTask(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (error) => {
      console.error('Erreur rejet:', error);
      alert('Erreur lors du rejet de la tâche');
    },
  });

  const mutateRequestRevision = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => requestTaskRevision(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (error) => {
      console.error('Erreur demande révision:', error);
      alert('Erreur lors de la demande de révision');
    },
  });
  const mutateDelete = useMutation({
    mutationFn: (id: string) => {
      console.log('🚀 Suppression de la tâche:', id);
      return deleteTask(id);
    },
    onSuccess: (data) => {
      console.log('✅ Tâche supprimée avec succès:', data);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      console.error('❌ Erreur suppression:', error);
      alert('Erreur lors de la suppression de la tâche');
    },
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const setToday = () => {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    setDateFrom(iso);
    setDateTo(iso);
  };

  const [openWizard, setOpenWizard] = useState(false);

  const onDownloadPdf = async (task: Task) => {
    const { contentType, data } = await getTaskPdfBase64(task.id);
    const d = new Date(task.date);
    const fn = `timesheet-${d.toISOString().slice(0, 10)}-${task.title.replace(/\s+/g, "-")}.pdf`;
    downloadBase64File(data, contentType, fn);
  };

  const formatDurationFR = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hPart = `${h}\u00A0h`;
    const mPart = `${m}\u00A0min`;
    return `${hPart} ${mPart}`;
  };

  const formatTimeDisplay = (task: { startTime?: string; endTime?: string; durationMin: number }) => {
    // Si on a les heures de début/fin, les afficher
    if (task.startTime && task.endTime) {
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const m = parseInt(minutes);
        return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, '0')}`;
      };
      return `${formatTime(task.startTime)} → ${formatTime(task.endTime)}`;
    }
    // Sinon, afficher l'ancienne durée
    return formatDurationFR(task.durationMin);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8 max-w-7xl">
        {/* Header Mobile-First */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">TimeSheet</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Gestion des feuilles de temps</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Dialog open={openWizard} onOpenChange={setOpenWizard}>
                <DialogTrigger asChild>
                  <Button aria-label="Créer un projet" variant="accent" className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-200" onClick={() => setOpenWizard(true)}>
                    <span className="mr-2">+</span> Créer un projet
                  </Button>
                </DialogTrigger>
                <DialogContent ariaLabelledby="create-project-title" className="max-w-4xl w-[95vw] max-h-[90vh] p-0 overflow-hidden">
                  <div className="flex flex-col h-full max-h-[90vh]">
                    <DialogHeader className="flex-shrink-0 flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                      <div>
                        <DialogTitle id="create-project-title" className="text-xl font-semibold text-gray-900 dark:text-white">Créer un nouveau projet</DialogTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Remplissez les informations pour créer votre projet</p>
                      </div>
                      <DialogClose>
                        <button type="button" aria-label="Fermer" className="rounded-lg p-2 hover:bg-white/50 dark:hover:bg-gray-600/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 transition-colors">
                          <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </button>
                      </DialogClose>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6">
                      <CreateProjectWizard
                        domains={domains ?? []}
                        onCancel={() => setOpenWizard(false)}
                        onCreate={async (payload: CreateTaskInput) => {
                          await createTask(payload);
                          setOpenWizard(false);
                          await qc.invalidateQueries({ queryKey: ["tasks"] });
                        }}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={() => refetch()} className="gap-2 w-full sm:w-auto">
                <RefreshCw className="size-4" />
                <span className="sm:inline">Actualiser</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Filtres Mobile-First avec bouton pliable */}
        <section aria-label="Filters">
          <Card className="rounded-xl sm:rounded-2xl border shadow-sm bg-white dark:bg-gray-800">
            <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="hidden sm:inline">Filtres et recherche</span>
                  <span className="sm:hidden">Filtres</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="sm:hidden flex items-center gap-1 text-xs"
                >
                  {showFilters ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Masquer
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Afficher
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className={`px-3 sm:px-6 transition-all duration-300 ${showFilters ? 'block' : 'hidden sm:block'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="title" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Titre</Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Rechercher..." 
                    className="h-9 sm:h-10 text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="status" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Statut</Label>
                  <select 
                    id="status" 
                    className="h-9 sm:h-10 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                    value={status ?? ""} 
                    onChange={(e) => setStatus(e.target.value ? (e.target.value as TaskStatus) : undefined)}
                  >
                    <option value="">Tous</option>
                    <option value="DRAFT">Brouillon</option>
                    <option value="SUBMITTED">Soumis</option>
                    <option value="APPROVED">Approuvé</option>
                    <option value="REJECTED">Rejeté</option>
                  </select>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="domain" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Domaine</Label>
                  <select 
                    id="domain" 
                    className="h-9 sm:h-10 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                    value={domainId ?? ""} 
                    onChange={(e) => setDomainId(e.target.value || undefined)}
                  >
                    <option value="">Tous</option>
                    {(domains ?? []).map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Section Période séparée */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Raccourcis</Label>
                    <Button 
                      variant="outline" 
                      onClick={setToday} 
                      aria-label="Filtrer aujourd'hui"
                      className="h-10 w-full text-sm"
                    >
                      📅 Aujourd&apos;hui
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from" className="text-sm font-medium text-gray-700 dark:text-gray-300">Date de début</Label>
                    <Input 
                      id="from" 
                      type="date" 
                      value={dateFrom} 
                      onChange={(e) => setDateFrom(e.target.value)} 
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="to" className="text-sm font-medium text-gray-700 dark:text-gray-300">Date de fin</Label>
                    <Input 
                      id="to" 
                      type="date" 
                      value={dateTo} 
                      onChange={(e) => setDateTo(e.target.value)} 
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 opacity-0">Action</Label>
                    <Button 
                      variant="outline" 
                      onClick={() => { setDateFrom(""); setDateTo(""); }} 
                      className="h-10 w-full text-sm"
                    >
                      🗑️ Effacer dates
                    </Button>
                  </div>
                </div>
              </div>

              {isAdminOrManager && (
                <div className="col-span-full border-t pt-6 mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <span className="w-4 h-4 bg-amber-100 dark:bg-amber-900/30 rounded flex items-center justify-center">
                      <span className="text-amber-600 dark:text-amber-400 text-xs">👥</span>
                    </span>{' '}
                    Filtres administrateur
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scope" className="text-sm font-medium text-gray-700 dark:text-gray-300">Portée</Label>
                      <select 
                        id="scope" 
                        className="h-10 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                        value={userScope} 
                        onChange={(e) => setUserScope(e.target.value as "me" | "all" | "specific")}
                      >
                        <option value="me">Moi uniquement</option>
                        <option value="all">Tous les utilisateurs</option>
                        <option value="specific">Utilisateur spécifique</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user" className="text-sm font-medium text-gray-700 dark:text-gray-300">Utilisateur</Label>
                      <select 
                        id="user" 
                        disabled={userScope !== "specific"} 
                        className="h-10 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                        value={userId ?? ""} 
                        onChange={(e) => setUserId(e.target.value || undefined)}
                      >
                        <option value="">Sélectionner un utilisateur</option>
                        {(users ?? []).map((u) => (
                          <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button 
                        variant="outline" 
                        onClick={() => refetch()}
                        className="h-10 w-full md:w-auto px-6 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                      >
                        Appliquer
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Feuilles de temps - Mobile Cards + Desktop Table */}
        <section>
          <Card className="rounded-xl sm:rounded-2xl border shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
            <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-xs sm:text-sm">📋</span>
                </div>
                <span className="hidden sm:inline">Feuilles de temps</span>
                <span className="sm:hidden">Feuilles</span>
                <Badge variant="outline" className="ml-auto text-xs">{total}</Badge>
              </CardTitle>
            </CardHeader>
            
            {/* Mobile Cards View */}
            <div className="sm:hidden px-3 pb-4 space-y-3">
              {isLoading && (
                <div className="text-center py-8 text-gray-500">Chargement...</div>
              )}
              {isError && (
                <div className="text-center py-8 text-red-500">{error?.message ?? "Erreur"}</div>
              )}
              {(data?.tasks ?? []).map((t: Task) => (
                <div key={t.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3 border">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(t.date).toLocaleDateString('fr-FR')}
                    </div>
                    <Badge variant={statusBadge[t.status].variant} className="text-xs">
                      {statusBadge[t.status].label}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{t.domain?.name ?? "-"}</Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeDisplay(t)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <div className="font-medium">{t.title}</div>
                      {t.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {t.description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      {t.report && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownloadPdf(t)}
                          className="h-7 px-2 text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          PDF
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {t.status === "DRAFT" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => mutateSubmit.mutate(t.id)}
                            disabled={mutateSubmit.isPending}
                            className="h-8 w-8 p-0 rounded-full border-2 border-green-300 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Soumettre"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTask(t)}
                            className="h-8 w-8 p-0 rounded-full border-2 border-blue-300 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => mutateDelete.mutate(t.id)}
                            className="h-8 w-8 p-0 rounded-full border-2 border-red-300 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {isAdminOrManager && t.status === "SUBMITTED" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => mutateApprove.mutate(t.id)}
                            disabled={mutateApprove.isPending}
                            className="h-8 w-8 p-0 rounded-full border-2 border-green-300 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Approuver"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const note = window.prompt("Note de révision");
                              if (note && note.trim().length >= 3) mutateRequestRevision.mutate({ id: t.id, note });
                            }}
                            disabled={mutateRequestRevision.isPending}
                            className="h-8 w-8 p-0 rounded-full border-2 border-blue-300 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Demander révision"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => mutateReject.mutate({ id: t.id, reason: "Rejeté depuis mobile" })}
                            disabled={mutateReject.isPending}
                            className="h-8 w-8 p-0 rounded-full border-2 border-orange-300 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Rejeter"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <CardContent className="hidden sm:block p-0">
              <div className="overflow-x-auto">
                <Table caption="Liste des feuilles de temps" containerClassName="">
          <TableCaption>Liste des feuilles de temps</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Domaine</TableHead>
              <TableHead>Activité</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>PDF</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={8}>Chargement…</TableCell></TableRow>
            )}
            {isError && (
              <TableRow><TableCell colSpan={8} className="text-destructive">{error?.message ?? "Erreur"}</TableCell></TableRow>
            )}
            {(data?.tasks ?? []).map((t: Task) => (
              <TableRow key={t.id}>
                <TableCell>{new Date(t.date).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell><Badge variant="outline">{t.domain?.name ?? "-"}</Badge></TableCell>
                <TableCell className="font-semibold">{t.title}</TableCell>
                <TableCell className="max-w-[280px] truncate" title={t.description ?? undefined}>{t.description ?? "-"}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => onDownloadPdf(t)} aria-label={`Télécharger le PDF pour ${t.title}`}>
                    <Download className="size-4" />
                  </Button>
                </TableCell>
                <TableCell>
                  {(() => { const s: TaskStatus = t.status; return (
                    <Badge variant={statusVariantMap[s]}>{statusBadge[s].label}</Badge>
                  ); })()}
                </TableCell>
                <TableCell>{formatTimeDisplay(t)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {t.status === "DRAFT" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTask(t)}
                          className="h-8 w-8 p-0 rounded-full border-2 border-blue-300 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => mutateSubmit.mutate(t.id)}
                          className="h-8 w-8 p-0 rounded-full border-2 border-green-300 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Soumettre"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => mutateDelete.mutate(t.id)}
                          className="h-8 w-8 p-0 rounded-full border-2 border-red-300 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {isAdminOrManager && t.status === "SUBMITTED" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => mutateApprove.mutate(t.id)}
                          disabled={mutateApprove.isPending}
                          className="h-8 w-8 p-0 rounded-full border-2 border-green-300 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Approuver"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const note = window.prompt("Note de révision");
                            if (note && note.trim().length >= 3) mutateRequestRevision.mutate({ id: t.id, note });
                          }}
                          disabled={mutateRequestRevision.isPending}
                          className="h-8 w-8 p-0 rounded-full border-2 border-blue-300 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Demander révision"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const reason = window.prompt("Raison du refus");
                            if (reason && reason.trim().length >= 3) mutateReject.mutate({ id: t.id, reason });
                          }}
                          disabled={mutateReject.isPending}
                          className="h-8 w-8 p-0 rounded-full border-2 border-orange-300 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Rejeter"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data && data.tasks.length === 0 && (
              <TableRow><TableCell colSpan={8}>Aucun résultat</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Pagination */}
        <Card className="rounded-2xl border shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <nav className="flex flex-col sm:flex-row items-center justify-between gap-4" aria-label="Pagination">
              <span className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
                Page <span className="font-semibold text-gray-900 dark:text-white">{page}</span> sur <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span> 
                <span className="text-gray-500 dark:text-gray-500">({total} éléments)</span>
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setPage((p) => Math.max(1, p - 1))} 
                  disabled={page <= 1}
                  className="h-10 px-4"
                >
                  ← Précédent
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
                  disabled={page >= totalPages}
                  className="h-10 px-4"
                >
                  Suivant →
                </Button>
              </div>
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* Modal d'édition */}
      <ModernEditTaskDialog
        task={editingTask}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </main>
  );
}
