export type TaskStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type ReportType = 'STANDARD' | 'CUSTOM';

export type DomainRef = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
};

export type UserRef = {
  readonly id: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly role: string;
};

export type Report = {
  readonly type: ReportType;
  readonly content: Record<string, unknown> | null;
};

export type Task = {
  readonly id: string;
  readonly userId: string;
  readonly domainId: string;
  readonly date: string; // ISO 8601
  readonly title: string;
  readonly description: string | null;
  // Nouveau système d'heures
  readonly startTime?: string;
  readonly endTime?: string;
  readonly durationMin: number;
  readonly status: TaskStatus;
  readonly managerNote: string | null;
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
  readonly domain: DomainRef;
  readonly user?: UserRef; // Informations de l'utilisateur
  readonly report: Report | null;
};

export type Paginated<T> = {
  readonly tasks: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
};

export type ListTasksQuery = {
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly title?: string;
  readonly status?: TaskStatus;
  readonly domainId?: string;
  readonly page?: number;
  readonly pageSize?: number;
  // admin/manager-only filters
  readonly userId?: string;
  readonly all?: string;
};

export type CreateTaskInput = {
  readonly domainId: string;
  readonly title: string;
  readonly description?: string | null;
  readonly date: string; // ISO 8601
  // Nouveau système d'heures (prioritaire)
  readonly startTime?: string;
  readonly endTime?: string;
  // Ancien système (optionnel pour compatibilité)
  readonly durationMin?: number;
  readonly reportType?: ReportType;
  readonly reportCategory?: string;
  readonly reportContent?: Record<string, unknown>;
};

export type UpdateTaskInput = Partial<CreateTaskInput>;
