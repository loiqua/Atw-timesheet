import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/fetcher';
import type { CreateTaskInput, ListTasksQuery, Paginated, Task, TaskStatus, UpdateTaskInput } from './types';

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) usp.set(k, String(v));
  }
  const q = usp.toString();
  return q ? `?${q}` : '';
}

export async function listTasks(query: ListTasksQuery): Promise<Paginated<Task>> {
  const q = buildQuery({
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    title: query.title,
    status: query.status,
    domainId: query.domainId,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
    // CORRECTION: Ajouter les paramètres admin manquants
    userId: query.userId,
    all: query.all,
  });
  return await apiGet<Paginated<Task>>(`/timesheet/tasks${q}`, { auth: true });
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  return await apiPost<CreateTaskInput, Task>('/timesheet/tasks', input, undefined, { auth: true });
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  return await apiPatch<UpdateTaskInput, Task>(`/timesheet/tasks/${id}`, input, undefined, { auth: true });
}

export async function deleteTask(id: string): Promise<{ message: string }> {
  return await apiDelete<{ message: string }>(`/timesheet/tasks/${id}`, undefined, { auth: true });
}

export async function submitTask(id: string): Promise<Task> {
  // POST submit returns updated task
  return await apiPost<Record<string, never>, Task>(`/timesheet/tasks/${id}/submit`, {}, undefined, { auth: true });
}

export async function approveTask(id: string): Promise<Task> {
  // Toujours envoyer un objet vide pour l'approbation simple
  return await apiPost<Record<string, never>, Task>(`/timesheet/tasks/${id}/approve`, {}, undefined, { auth: true });
}

export async function rejectTask(id: string, reason: string): Promise<Task> {
  return await apiPost<{ reason: string }, Task>(`/timesheet/tasks/${id}/reject`, { reason }, undefined, { auth: true });
}

export async function requestTaskRevision(id: string, note: string): Promise<Task> {
  return await apiPost<{ note: string }, Task>(`/timesheet/tasks/${id}/request-revision`, { note }, undefined, { auth: true });
}

export async function getTaskPdfBase64(id: string): Promise<{ contentType: string; data: string }> {
  return await apiGet<{ contentType: string; data: string }>(`/timesheet/tasks/${id}/pdf`, { auth: true });
}

export const TimesheetStatus: Readonly<Record<TaskStatus, TaskStatus>> = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

// Filters helpers
export type Domain = { readonly id: string; readonly name: string; readonly slug: string };
export type UserSummary = { readonly id: string; readonly fullName: string; readonly email: string; readonly username: string | null };

export async function listDomains(): Promise<readonly Domain[]> {
  return await apiGet<readonly Domain[]>(`/domains`); // public list
}

export async function listUsers(): Promise<readonly UserSummary[]> {
  return await apiGet<readonly UserSummary[]>(`/users`, { auth: true }); // admin/manager only
}
