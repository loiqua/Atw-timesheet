# ATW Timesheet Calendar API

A comprehensive calendar system for ATW Timesheet with weekly view, task management, and real-time statistics.

## Features

- 📅 **Weekly Calendar View**
  - Interactive weekly timesheet visualization
  - Real-time task status updates
  - Mobile-responsive design with hybrid views
  - Drag-and-drop task management (future)
- 📊 **Statistics & Analytics**
  - Weekly hours tracking
  - Task status distribution
  - User performance metrics
  - Domain-based filtering
- 🎯 **Task Management**
  - Task approval/rejection workflow
  - Status-based color coding
  - Detailed task information modals
  - Admin/Manager permissions
- 🔍 **Advanced Filtering**
  - User-based filtering (Admin/Manager)
  - Domain and status filters
  - Date range navigation
  - Real-time filter updates
- 📱 **Mobile Experience**
  - Native mobile layout (< 768px)
  - Touch-optimized interactions
  - Responsive card-based design
  - Optimized loading states

## Tech Stack

- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Frontend**: Next.js 15 + React 19
- **UI Components**: Radix UI + TailwindCSS
- **State Management**: React Query + Zustand
- **Authentication**: JWT Guards
- **Documentation**: Swagger/OpenAPI

## Architecture Overview

### Backend Components

```
src/calendar/
├── calendar.controller.ts    # RESTful API endpoints
├── calendar.service.ts       # Business logic & Prisma queries
├── calendar.module.ts        # NestJS module configuration
└── dto/                      # Data Transfer Objects
    ├── calendar-filters.dto.ts
    ├── calendar-week-response.dto.ts
    ├── calendar-stats-response.dto.ts
    ├── calendar-user-response.dto.ts
    ├── calendar-domain-response.dto.ts
    └── update-task-status.dto.ts
```

### Frontend Components

```
src/components/calendar/
├── CalendarView.tsx          # Main calendar interface
├── WeekView.tsx              # Weekly grid/mobile views
├── TimeSlotCard.tsx          # Interactive task cards
├── CalendarStats.tsx         # Statistics dashboard
├── StatusLegend.tsx          # Status color legend
└── MobileCalendarView.tsx    # Dedicated mobile view
```

## API Endpoints

### Calendar Data

- `GET /calendar/week` - Get weekly calendar data with filters
- `GET /calendar/stats` - Get weekly statistics
- `GET /calendar/users` - Get users list (Admin/Manager only)
- `GET /calendar/domains` - Get domains list
- `GET /calendar/timeslots/:id` - Get detailed timeslot information

### Task Management

- `PATCH /calendar/tasks/:id/status` - Update task status (Admin/Manager only)

### Query Parameters for `/calendar/week`

```typescript
interface CalendarFilters {
  weekStartDate: string;    // ISO date (YYYY-MM-DD)
  userId?: string;          // Filter by user (Admin/Manager only)
  domainId?: string;        // Filter by domain
  status?: TaskStatus;      // Filter by task status
}
```

## Database Schema

### Key Models

```prisma
model Task {
  id          String     @id @default(uuid())
  title       String
  description String?
  startTime   DateTime
  endTime     DateTime
  status      TaskStatus @default(DRAFT)
  userId      String
  domainId    String
  projectId   String?
  
  user        User       @relation(fields: [userId], references: [id])
  domain      Domain     @relation(fields: [domainId], references: [id])
  project     Project?   @relation(fields: [projectId], references: [id])
  
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

enum TaskStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
}
```

## Frontend Architecture

### State Management

- **React Query**: Server state, caching, and synchronization
- **Zustand**: Authentication and user state
- **Local State**: Component-specific UI state

### Responsive Design Strategy

#### Desktop View (≥ 768px)
- 8-column grid layout (1 time + 7 days)
- Horizontal scrolling for overflow
- Hover-based action buttons
- Full filter visibility

#### Mobile View (< 768px)
- Vertical day-by-day cards
- Touch-optimized interactions
- Stacked filter layout
- Simplified navigation

### Key Components Deep Dive

#### CalendarView.tsx
Main orchestrator component handling:
- Filter state management
- API data fetching with React Query
- Permission-based UI rendering
- Responsive layout coordination

```typescript
// Key features
const { user } = useAuthStore();
const isAdmin = user?.role === 'ADMIN';
const canViewAllUsers = isAdmin || user?.role === 'MANAGER';

// React Query integration
const { data: weekData, isLoading } = useQuery({
  queryKey: ['calendar-week', filters],
  queryFn: () => calendarService.getWeekData(filters),
});
```

#### WeekView.tsx
Hybrid view component with:
- Conditional mobile/desktop rendering
- Dynamic time slot positioning
- Skeleton loading states
- Optimized key generation

```typescript
// Mobile vs Desktop rendering
return (
  <>
    {/* Mobile View */}
    <div className="block md:hidden">
      {/* Day-by-day cards */}
    </div>
    
    {/* Desktop View */}
    <div className="hidden md:block">
      {/* Traditional grid layout */}
    </div>
  </>
);
```

#### TimeSlotCard.tsx
Interactive task cards featuring:
- Status-based color coding
- Detailed information modals
- Admin action buttons
- Accessibility support

```typescript
// Status colors mapping
const statusColors = TASK_STATUS_COLORS[timeSlot.status];

// Admin actions
{canManage && timeSlot.status === 'SUBMITTED' && (
  <div className="flex gap-2">
    <Button onClick={handleApprove}>Approve</Button>
    <Button onClick={handleReject}>Reject</Button>
  </div>
)}
```

## Security & Permissions

### Role-Based Access Control

- **EMPLOYEE**: View personal timesheets only
- **MANAGER**: View team timesheets + approve/reject
- **ADMIN**: Full access to all users and actions

### API Security

```typescript
// JWT Authentication required
@UseGuards(JwtAuthGuard)
@Controller('calendar')
export class CalendarController {
  
  // Admin/Manager only endpoints
  @Get('users')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getUsers() { ... }
  
  // Task status updates
  @Patch('tasks/:id/status')
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateTaskStatus() { ... }
}
```

## Performance Optimizations

### Backend Optimizations

- **Prisma Queries**: Optimized with proper relations and indexing
- **Caching**: Query result caching for frequently accessed data
- **Pagination**: Efficient data loading for large datasets

```typescript
// Optimized Prisma query
const tasks = await this.prisma.task.findMany({
  where: whereClause,
  include: {
    user: { select: { id: true, fullName: true, email: true } },
    domain: { select: { id: true, name: true, color: true } },
    project: { select: { id: true, name: true } }
  },
  orderBy: { startTime: 'asc' }
});
```

### Frontend Optimizations

- **React Query**: Intelligent caching and background updates
- **Code Splitting**: Lazy loading of calendar components
- **Memoization**: Optimized re-renders with useMemo/useCallback
- **Skeleton Loading**: Improved perceived performance

```typescript
// React Query with intelligent caching
const { data: weekData } = useQuery({
  queryKey: ['calendar-week', filters],
  queryFn: () => calendarService.getWeekData(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

## API Client Integration

### Centralized API Client

```typescript
// src/lib/api-client.ts
export const apiClient = {
  async get<T>(path: string): Promise<{ data: T }> {
    const data = await apiGet<T>(path, { auth: true });
    return { data };
  },
  // ... other methods
};
```

### Calendar Service

```typescript
// src/services/calendar.service.ts
class CalendarService {
  async getWeekData(filters: CalendarFilters): Promise<CalendarWeek> {
    const params = new URLSearchParams({
      weekStartDate: filters.weekStartDate,
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.domainId && { domainId: filters.domainId }),
      ...(filters.status && { status: filters.status })
    });

    const response = await apiClient.get(`/calendar/week?${params}`);
    return response.data;
  }
}
```

## Testing Strategy

### Backend Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend Tests

```bash
# Component tests
npm run test

# E2E tests with Playwright
npm run test:e2e
```

## Development Setup

### Prerequisites

- Node.js (v18+)
- PostgreSQL database
- Environment variables configured

### Installation

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Start development servers
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/atw_timesheet"

# JWT
JWT_SECRET="your-jwt-secret"

# Application
PORT=8000
```

## Usage Examples

### Get Weekly Calendar Data

```bash
# Get current week for authenticated user
curl -X GET "http://localhost:8000/calendar/week?weekStartDate=2024-01-15" \
  -H "Authorization: Bearer <token>"

# Admin view with user filter
curl -X GET "http://localhost:8000/calendar/week?weekStartDate=2024-01-15&userId=user-id" \
  -H "Authorization: Bearer <admin-token>"
```

### Update Task Status

```bash
# Approve a task (Manager/Admin only)
curl -X PATCH "http://localhost:8000/calendar/tasks/task-id/status" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "APPROVED"}'
```

### Get Calendar Statistics

```bash
# Get weekly stats
curl -X GET "http://localhost:8000/calendar/stats?weekStartDate=2024-01-15" \
  -H "Authorization: Bearer <token>"
```

## Error Handling

### Common HTTP Status Codes

- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Missing/invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Invalid date format",
  "error": "Bad Request"
}
```

## Monitoring & Logging

### Backend Logging

```typescript
// Structured logging in services
this.logger.log(`Calendar week data requested for user ${userId}`, {
  userId,
  weekStartDate,
  filters
});
```

### Performance Metrics

- API response times
- Database query performance
- Frontend rendering metrics
- User interaction analytics

## Future Enhancements

### Planned Features

- **Drag & Drop**: Visual task rescheduling
- **Real-time Updates**: WebSocket integration
- **Export Functionality**: PDF/Excel export
- **Calendar Sync**: Google/Outlook integration
- **Notifications**: Task deadline alerts
- **Offline Support**: PWA capabilities

### Technical Improvements

- **GraphQL**: More efficient data fetching
- **Microservices**: Service decomposition
- **Redis Caching**: Enhanced performance
- **CDN Integration**: Static asset optimization

## Troubleshooting

### Common Issues

1. **Calendar not loading**
   - Check authentication token
   - Verify API endpoint accessibility
   - Check browser console for errors

2. **Mobile view issues**
   - Clear browser cache
   - Check viewport meta tag
   - Verify responsive breakpoints

3. **Task status updates failing**
   - Verify user permissions
   - Check task status workflow
   - Review API error messages

### Debug Mode

```bash
# Enable debug logging
DEBUG=calendar:* npm run start:dev
```

## Contributing

### Code Style

- TypeScript strict mode
- ESLint + Prettier configuration
- Conventional commits
- Comprehensive testing

### Pull Request Process

1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Submit PR with detailed description

## License

This project is [MIT licensed](LICENSE).

---

## 📁 Key Files & Code References

### Backend Files

- [`src/calendar/calendar.controller.ts`](./src/calendar/calendar.controller.ts) - Main API controller
  - Methods: [`getWeekData`](./src/calendar/calendar.controller.ts#L23), [`getStats`](./src/calendar/calendar.controller.ts#L45), [`updateTaskStatus`](./src/calendar/calendar.controller.ts#L67)
- [`src/calendar/calendar.service.ts`](./src/calendar/calendar.service.ts) - Business logic implementation
  - Core methods: [`getWeekData`](./src/calendar/calendar.service.ts#L34), [`getWeekStats`](./src/calendar/calendar.service.ts#L89), [`updateTaskStatus`](./src/calendar/calendar.service.ts#L156)
- [`src/calendar/calendar.module.ts`](./src/calendar/calendar.module.ts) - NestJS module configuration

### Frontend Files

- [`src/components/calendar/CalendarView.tsx`](../frontend/src/components/calendar/CalendarView.tsx) - Main calendar interface
- [`src/components/calendar/WeekView.tsx`](../frontend/src/components/calendar/WeekView.tsx) - Hybrid mobile/desktop view
- [`src/components/calendar/TimeSlotCard.tsx`](../frontend/src/components/calendar/TimeSlotCard.tsx) - Interactive task cards
- [`src/services/calendar.service.ts`](../frontend/src/services/calendar.service.ts) - Frontend API client
- [`src/lib/api-client.ts`](../frontend/src/lib/api-client.ts) - Centralized HTTP client

### DTOs & Types

- [`src/calendar/dto/calendar-filters.dto.ts`](./src/calendar/dto/calendar-filters.dto.ts) - Request validation
- [`src/calendar/dto/calendar-week-response.dto.ts`](./src/calendar/dto/calendar-week-response.dto.ts) - Week data structure
- [`src/calendar/dto/calendar-stats-response.dto.ts`](./src/calendar/dto/calendar-stats-response.dto.ts) - Statistics response
- [`src/types/calendar.ts`](../frontend/src/types/calendar.ts) - Frontend TypeScript types

### Database Schema

- [`prisma/schema.prisma`](../prisma/schema.prisma) - Task, User, Domain models

### Key Code Snippets

#### Calendar Service - Week Data Query

```typescript
// src/calendar/calendar.service.ts
async getWeekData(filters: CalendarFiltersDto): Promise<CalendarWeekResponseDto> {
  const { weekStartDate, userId, domainId, status } = filters;
  
  const startDate = new Date(weekStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  const whereClause: Prisma.TaskWhereInput = {
    date: {
      gte: startDate,
      lte: endDate,
    },
    ...(userId && { userId }),
    ...(domainId && { domainId }),
    ...(status && { status }),
  };

  const tasks = await this.prisma.task.findMany({
    where: whereClause,
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      domain: { select: { id: true, name: true, color: true } },
      project: { select: { id: true, name: true } }
    },
    orderBy: { startTime: 'asc' }
  });

  return this.formatWeekData(tasks, startDate);
}
```

#### Frontend - Responsive WeekView

```typescript
// src/components/calendar/WeekView.tsx
export const WeekView: React.FC<WeekViewProps> = ({ weekData, loading, canManageTasks }) => {
  return (
    <>
      {/* Mobile View (< 768px) */}
      <div className="block md:hidden">
        <div className="space-y-4">
          {weekData.days.map((day) => (
            <div key={`mobile-day-${day.date}`} className="border rounded-lg overflow-hidden">
              {/* Day header with today indicator */}
              <div className={cn(
                "p-3 border-b bg-gray-50 dark:bg-gray-900/50",
                day.isToday && "bg-primary/10 border-primary/20"
              )}>
                {/* Day content */}
              </div>
              
              {/* Time slots as cards */}
              <div className="p-3 space-y-2">
                {day.timeSlots.map((slot) => (
                  <TimeSlotCard key={slot.id} timeSlot={slot} canManage={canManageTasks} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop View (≥ 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Traditional 8-column grid */}
        </div>
      </div>
    </>
  );
};
```

#### API Client Integration

```typescript
// src/lib/api-client.ts
export const apiClient = {
  async get<T = unknown>(path: string): Promise<{ data: T }> {
    const data = await apiGet<T>(path, { auth: true });
    return { data };
  },

  async patch<TBody extends object, TResp = unknown>(
    path: string, 
    body: TBody
  ): Promise<{ data: TResp }> {
    const data = await apiPatch<TBody, TResp>(path, body, undefined, { auth: true });
    return { data };
  }
};
```

#### Task Status Update

```typescript
// src/services/calendar.service.ts
class CalendarService {
  async updateTaskStatus(taskId: string, status: 'APPROVED' | 'REJECTED'): Promise<void> {
    await apiClient.patch(`/calendar/tasks/${taskId}/status`, { status });
  }
}

// Usage in component
const updateStatusMutation = useMutation({
  mutationFn: ({ taskId, status }: { taskId: string; status: 'APPROVED' | 'REJECTED' }) =>
    calendarService.updateTaskStatus(taskId, status),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['calendar-week'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-stats'] });
  },
});
```

#### Mobile-First Responsive Design

```typescript
// src/components/calendar/CalendarView.tsx
return (
  <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6">
    {/* Responsive header */}
    <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
      Calendrier des Timesheets
    </h1>
    
    {/* Stacked filters on mobile */}
    <div className="flex flex-col gap-3">
      {/* User filter (admin only) */}
      {canViewAllUsers && (
        <Select value={filters.userId ?? "all"}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tous les utilisateurs" />
          </SelectTrigger>
        </Select>
      )}
      
      {/* Domain and status filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filters.domainId ?? "all"}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tous les domaines" />
          </SelectTrigger>
        </Select>
        
        <Select value={filters.status ?? "all"}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
        </Select>
      </div>
    </div>
  </div>
);
```

---

For any questions or issues, please refer to the codebase or contact the maintainer.
