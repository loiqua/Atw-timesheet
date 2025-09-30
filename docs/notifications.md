# 🔔 Système de Notifications - ATW Timesheet

> **Version**: 1.0.0  
> **Date**: 30 septembre 2025  
> **Statut**: Production Ready ✅

---

## 📖 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Backend API](#backend-api)
4. [Frontend Integration](#frontend-integration)
5. [WebSocket Protocol](#websocket-protocol)
6. [Types de notifications](#types-de-notifications)
7. [Guide d'utilisation](#guide-dutilisation)
8. [Configuration](#configuration)
9. [Sécurité](#sécurité)
10. [Performance](#performance)
11. [Troubleshooting](#troubleshooting)
12. [Exemples](#exemples)

---

## 🎯 Vue d'ensemble

Le système de notifications d'ATW Timesheet offre une communication **temps réel** entre le backend et les utilisateurs via **WebSocket** et **REST API**. Il permet d'informer instantanément les utilisateurs des actions importantes (approbations, rejets, révisions de tâches, rappels, etc.).

### ✨ Fonctionnalités principales

- ✅ **Notifications temps réel** via WebSocket (Socket.IO)
- ✅ **Badge dynamique** avec compteur de notifications non lues
- ✅ **Pagination** pour les listes de notifications
- ✅ **Filtrage** (toutes, non lues uniquement)
- ✅ **Actions rapides** : marquer comme lu, voir la tâche
- ✅ **Multi-device** : synchronisation sur tous les appareils connectés
- ✅ **Animations** : pulse, bounce pour les nouvelles notifications
- ✅ **Responsive** : interface adaptée mobile/desktop
- ✅ **Persistance** : stockage en base de données PostgreSQL
- ✅ **Sécurité** : authentification JWT pour WebSocket

---

## 🏗️ Architecture

### Schéma général

```mermaid
graph TB
    subgraph "Frontend (React)"
        UI[NotificationBell]
        LIST[NotificationsList]
        HOOKS[useNotifications]
        WS_CLIENT[WebSocket Client]
    end
    
    subgraph "Backend (NestJS)"
        CONTROLLER[NotificationsController]
        SERVICE[NotificationsService]
        GATEWAY[NotificationsGateway]
        TIMESHEET[TimesheetService]
    end
    
    subgraph "Database"
        POSTGRES[(PostgreSQL)]
        PRISMA[Prisma ORM]
    end
    
    UI --> HOOKS
    HOOKS --> WS_CLIENT
    HOOKS --> CONTROLLER
    LIST --> HOOKS
    
    WS_CLIENT <--> GATEWAY
    CONTROLLER --> SERVICE
    GATEWAY --> SERVICE
    TIMESHEET --> SERVICE
    
    SERVICE --> PRISMA
    PRISMA --> POSTGRES
```

### Flux de données

1. **Création** : Une action (ex: approbation tâche) déclenche la création d'une notification
2. **Stockage** : La notification est sauvegardée en base de données
3. **Diffusion WebSocket** : Si l'utilisateur est connecté, notification envoyée en temps réel
4. **Mise à jour UI** : Le badge et la liste sont mis à jour automatiquement
5. **Persistance** : Les notifications restent accessibles même après déconnexion

---

## 🔌 Backend API

### Module NestJS

#### Structure des fichiers

```
apps/api/src/notifications/
├── notifications.controller.ts    # REST API endpoints
├── notifications.service.ts       # Business logic
├── notifications.gateway.ts       # WebSocket gateway
├── notifications.module.ts        # Module configuration
└── dto/
    ├── create-notification.dto.ts
    ├── notification-response.dto.ts
    ├── mark-as-read.dto.ts
    └── index.ts
```

### REST API Endpoints

#### 1. **GET /notifications**
Récupère les notifications de l'utilisateur avec pagination.

**Query Parameters:**
- `page` (number, optional): Numéro de page (défaut: 1)
- `limit` (number, optional): Nombre par page (défaut: 20)
- `unreadOnly` (boolean, optional): Filtrer uniquement non lues (défaut: false)

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "userId": "user-uuid",
      "type": "TASK_APPROVED",
      "title": "Tâche approuvée",
      "message": "Votre tâche 'Développement API' a été approuvée",
      "isRead": false,
      "relatedTaskId": "task-uuid",
      "metadata": {
        "taskTitle": "Développement API",
        "approvedBy": "Manager Name"
      },
      "createdAt": "2025-09-30T10:30:00Z",
      "updatedAt": "2025-09-30T10:30:00Z"
    }
  ],
  "total": 45,
  "unreadCount": 3
}
```

**Exemple cURL:**
```bash
curl -X GET "http://localhost:8000/notifications?page=1&limit=20&unreadOnly=false" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### 2. **GET /notifications/unread-count**
Récupère le nombre de notifications non lues.

**Response:**
```json
{
  "count": 3
}
```

**Exemple cURL:**
```bash
curl -X GET "http://localhost:8000/notifications/unread-count" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### 3. **PATCH /notifications/mark-as-read**
Marque plusieurs notifications comme lues (ou toutes si aucun ID fourni).

**Body:**
```json
{
  "notificationIds": [
    "123e4567-e89b-12d3-a456-426614174000",
    "223e4567-e89b-12d3-a456-426614174001"
  ]
}
```

**Response:**
```json
{
  "updatedCount": 2
}
```

**Exemple cURL:**
```bash
curl -X PATCH "http://localhost:8000/notifications/mark-as-read" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notificationIds": ["123e4567-e89b-12d3-a456-426614174000"]}'
```

---

#### 4. **PATCH /notifications/:id/read**
Marque une notification spécifique comme lue.

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "isRead": true,
  "updatedAt": "2025-09-30T10:35:00Z"
}
```

**Exemple cURL:**
```bash
curl -X PATCH "http://localhost:8000/notifications/123e4567-e89b-12d3-a456-426614174000/read" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### NotificationsService

#### Méthodes principales

```typescript
class NotificationsService {
  // Créer une notification
  async createNotification(dto: CreateNotificationDto): Promise<NotificationResponseDto>
  
  // Récupérer les notifications d'un utilisateur
  async getUserNotifications(userId: string, options: PaginationOptions): Promise<NotificationResponse>
  
  // Compter les notifications non lues
  async getUnreadCount(userId: string): Promise<{ count: number }>
  
  // Marquer comme lues
  async markAsRead(userId: string, notificationIds?: string[]): Promise<{ updatedCount: number }>
  
  // Marquer une seule comme lue
  async markSingleAsRead(userId: string, notificationId: string): Promise<NotificationResponseDto>
  
  // Supprimer une notification
  async deleteNotification(userId: string, notificationId: string): Promise<void>
}
```

#### Exemple d'utilisation dans TimesheetService

```typescript
// Lors de l'approbation d'une tâche
async approveTask(taskId: string, managerId: string) {
  const task = await this.prisma.task.update({
    where: { id: taskId },
    data: { status: 'APPROVED' },
    include: { user: true }
  });

  // Créer une notification
  const notification = await this.notificationsService.createNotification({
    userId: task.userId,
    type: NotificationType.TASK_APPROVED,
    title: 'Tâche approuvée',
    message: `Votre tâche "${task.title}" a été approuvée`,
    relatedTaskId: task.id,
    metadata: {
      taskTitle: task.title,
      approvedBy: managerId
    }
  });

  // Envoyer en temps réel via WebSocket
  this.notificationsGateway.sendNotificationToUser(task.userId, notification);
  
  return task;
}
```

---

## 🌐 WebSocket Protocol

### NotificationsGateway

#### Configuration

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
```

#### Connexion

**Client → Server:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000/notifications', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connected', (data) => {
  console.log('Connected to notifications:', data.message);
});
```

#### Événements WebSocket

##### 1. **Server → Client: `new-notification`**
Envoyé lorsqu'une nouvelle notification est créée.

```javascript
socket.on('new-notification', (notification) => {
  console.log('New notification:', notification);
  // Mettre à jour l'UI
});
```

**Payload:**
```json
{
  "id": "notification-uuid",
  "type": "TASK_APPROVED",
  "title": "Tâche approuvée",
  "message": "Votre tâche a été approuvée",
  "isRead": false,
  "createdAt": "2025-09-30T10:30:00Z"
}
```

---

##### 2. **Server → Client: `unread-count-updated`**
Envoyé lorsque le compteur de notifications non lues change.

```javascript
socket.on('unread-count-updated', ({ count }) => {
  console.log('Unread count:', count);
  // Mettre à jour le badge
});
```

**Payload:**
```json
{
  "count": 5
}
```

---

##### 3. **Client → Server: `join-notifications`**
Rejoindre la room des notifications (optionnel, fait automatiquement).

```javascript
socket.emit('join-notifications');

socket.on('joined-notifications', (data) => {
  console.log(data.message);
});
```

---

##### 4. **Client → Server: `mark-notification-read`**
Marquer une notification comme lue (diffusé à tous les appareils).

```javascript
socket.emit('mark-notification-read', {
  notificationId: 'notification-uuid'
});

socket.on('notification-marked-read', ({ notificationId }) => {
  console.log('Notification marked as read:', notificationId);
});
```

---

### Authentification WebSocket

Le gateway vérifie le JWT lors de la connexion :

```typescript
async handleConnection(client: AuthenticatedSocket) {
  const token = client.handshake.auth?.token;
  
  // Vérifier le JWT
  const payload = await this.jwtService.verifyAsync(token);
  const userId = payload.sub;
  
  // Associer le socket à l'utilisateur
  client.userId = userId;
  await client.join(`user:${userId}`);
}
```

---

## 💻 Frontend Integration

### Structure des fichiers

```
apps/frontend/src/
├── components/notifications/
│   ├── NotificationBell.tsx       # Badge avec compteur
│   ├── NotificationsList.tsx      # Liste paginée
│   └── NotificationItem.tsx       # Item individuel
├── hooks/
│   └── useNotifications.ts        # Custom hooks React Query
├── services/
│   └── notifications.service.ts   # API client
└── types/
    └── notifications.ts            # TypeScript types
```

### Composants React

#### 1. **NotificationBell**

Badge avec compteur de notifications non lues.

**Props:**
```typescript
interface NotificationBellProps {
  readonly onViewTask?: (taskId: string) => void;
  readonly className?: string;
}
```

**Utilisation:**
```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';

function Header() {
  const handleViewTask = (taskId: string) => {
    router.push(`/timesheet?taskId=${taskId}`);
  };

  return (
    <header>
      <NotificationBell onViewTask={handleViewTask} />
    </header>
  );
}
```

**Fonctionnalités:**
- Badge rouge avec compteur (99+ si > 99)
- Animation pulse pour nouvelles notifications
- Animation bounce sur le badge
- Indicateur ping rouge pour notifications récentes
- Ouverture de la liste au clic

---

#### 2. **NotificationsList**

Liste paginée de notifications avec actions.

**Props:**
```typescript
interface NotificationsListProps {
  readonly onViewTask?: (taskId: string) => void;
  readonly onClose?: () => void;
}
```

**Utilisation:**
```tsx
import { NotificationsList } from '@/components/notifications/NotificationsList';

function NotificationsPage() {
  return (
    <div className="container">
      <NotificationsList
        onViewTask={(taskId) => router.push(`/tasks/${taskId}`)}
      />
    </div>
  );
}
```

**Fonctionnalités:**
- Pagination (20 par page)
- Filtre "Non lues uniquement"
- Bouton "Tout marquer comme lu"
- Infinite scroll (optionnel)
- États de chargement (skeleton)
- État vide avec message

---

#### 3. **NotificationItem**

Carte individuelle de notification.

**Props:**
```typescript
interface NotificationItemProps {
  readonly notification: Notification;
  readonly onMarkAsRead?: (id: string) => void;
  readonly onViewTask?: (taskId: string) => void;
}
```

**Fonctionnalités:**
- Icône selon le type de notification
- Badge de statut (lu/non lu)
- Bouton "Voir la tâche"
- Bouton "Marquer comme lu"
- Timestamp relatif (ex: "Il y a 2 heures")
- Hover effects

---

### Custom Hooks

#### 1. **useNotifications**

Hook pour récupérer et gérer les notifications.

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function NotificationsList() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useNotifications({
    page: 1,
    limit: 20,
    unreadOnly: false
  });

  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {data.notifications.map(notif => (
        <NotificationItem key={notif.id} notification={notif} />
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          Charger plus
        </button>
      )}
    </div>
  );
}
```

---

#### 2. **useUnreadCount**

Hook pour le compteur de notifications non lues.

```typescript
import { useUnreadCount } from '@/hooks/useNotifications';

function NotificationBadge() {
  const { data, isLoading } = useUnreadCount();
  const count = data?.count ?? 0;

  return (
    <Badge variant="destructive">
      {count > 99 ? '99+' : count}
    </Badge>
  );
}
```

**Fonctionnalités:**
- Mise à jour automatique toutes les 30 secondes
- Mise à jour temps réel via WebSocket
- Cache intelligent avec React Query

---

#### 3. **useMarkAsRead**

Hook pour marquer des notifications comme lues.

```typescript
import { useMarkAsRead } from '@/hooks/useNotifications';

function NotificationActions() {
  const { mutate: markAsRead, isPending } = useMarkAsRead();

  const handleMarkAllAsRead = () => {
    markAsRead(
      {}, // Vide = toutes les notifications
      {
        onSuccess: () => {
          toast.success('Toutes les notifications marquées comme lues');
        }
      }
    );
  };

  return (
    <button onClick={handleMarkAllAsRead} disabled={isPending}>
      Tout marquer comme lu
    </button>
  );
}
```

---

#### 4. **useWebSocket**

Hook pour la connexion WebSocket (utilisé en interne).

```typescript
import { useWebSocket } from '@/hooks/useNotifications';

function App() {
  const { isConnected, error } = useWebSocket();

  useEffect(() => {
    if (isConnected) {
      console.log('WebSocket connected');
    }
  }, [isConnected]);

  return <YourApp />;
}
```

**Événements gérés:**
- `new-notification`: Nouvelle notification reçue
- `unread-count-updated`: Compteur mis à jour
- `notification-marked-read`: Notification marquée comme lue
- `connected`: Connexion établie
- `disconnect`: Déconnexion

---

## 📋 Types de notifications

### Enum NotificationType

```typescript
enum NotificationType {
  TASK_APPROVED = 'TASK_APPROVED',
  TASK_REJECTED = 'TASK_REJECTED',
  TASK_NEEDS_REVISION = 'TASK_NEEDS_REVISION',
  DEADLINE_REMINDER = 'DEADLINE_REMINDER',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT'
}
```

### Détails par type

#### 1. **TASK_APPROVED**
- **Déclencheur** : Un manager approuve une tâche
- **Destinataire** : Créateur de la tâche
- **Icône** : ✅ CheckCircle (vert)
- **Message** : "Votre tâche '{title}' a été approuvée"

#### 2. **TASK_REJECTED**
- **Déclencheur** : Un manager rejette une tâche
- **Destinataire** : Créateur de la tâche
- **Icône** : ❌ XCircle (rouge)
- **Message** : "Votre tâche '{title}' a été rejetée"
- **Metadata** : `{ reason: string }`

#### 3. **TASK_NEEDS_REVISION**
- **Déclencheur** : Un manager demande une révision
- **Destinataire** : Créateur de la tâche
- **Icône** : 🔄 RefreshCw (orange)
- **Message** : "Votre tâche '{title}' nécessite des modifications"
- **Metadata** : `{ note: string }`

#### 4. **DEADLINE_REMINDER**
- **Déclencheur** : Système (cron job)
- **Destinataire** : Utilisateur concerné
- **Icône** : ⏰ Clock (bleu)
- **Message** : "Rappel : Échéance dans X jours"

#### 5. **SYSTEM_ANNOUNCEMENT**
- **Déclencheur** : Admin
- **Destinataire** : Tous les utilisateurs ou groupe
- **Icône** : 📢 Megaphone (violet)
- **Message** : Personnalisé

---

## ⚙️ Configuration

### Variables d'environnement

#### Backend (.env)

```bash
# WebSocket
FRONTEND_URL=http://localhost:3000

# JWT (déjà configuré)
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Database (déjà configuré)
DATABASE_URL=postgresql://user:password@localhost:5432/atw_timesheet
```

#### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=http://localhost:8000
```

### Configuration Prisma

```prisma
model Notification {
  id        String           @id @default(uuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false)
  
  relatedTaskId String?
  relatedTask   Task?   @relation(fields: [relatedTaskId], references: [id], onDelete: Cascade)
  
  metadata  Json?
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @db.Timestamptz(6)
  
  @@index([userId])
  @@index([type])
  @@index([isRead])
  @@index([createdAt])
  @@index([userId, isRead])
}
```

### Migration

```bash
# Appliquer la migration
npm run db:migrate

# Ou manuellement
cd apps/api
npx prisma migrate deploy
```

---

## 🔒 Sécurité

### Authentification

#### REST API
- **JWT Bearer Token** requis dans le header `Authorization`
- Validation du token via `JwtAuthGuard`
- Vérification de l'utilisateur dans chaque endpoint

#### WebSocket
- **JWT Token** dans `handshake.auth.token`
- Vérification asynchrone avec `jwtService.verifyAsync()`
- Déconnexion automatique si token invalide
- Association socket ↔ userId sécurisée

### Autorisation

- **User-specific rooms** : Chaque utilisateur ne reçoit que ses notifications
- **Validation ownership** : Vérification userId dans les requêtes
- **Prisma filters** : Filtrage automatique par userId dans les requêtes DB

### Validation des données

```typescript
// CreateNotificationDto
@IsUUID()
userId: string;

@IsEnum(NotificationType)
type: NotificationType;

@IsString()
@MinLength(1)
@MaxLength(200)
title: string;

@IsString()
@MinLength(1)
@MaxLength(1000)
message: string;
```

### Protection CORS

```typescript
// WebSocket CORS
cors: {
  origin: process.env.FRONTEND_URL,
  credentials: true
}

// REST API CORS (main.ts)
app.enableCors({
  origin: [process.env.FRONTEND_URL],
  credentials: true
});
```

---

## ⚡ Performance

### Optimisations Backend

#### 1. **Indexes Prisma**
```prisma
@@index([userId])           // Requêtes par utilisateur
@@index([type])             // Filtrage par type
@@index([isRead])           // Filtrage lu/non lu
@@index([createdAt])        // Tri chronologique
@@index([userId, isRead])   // Composite pour compteur non lus
```

#### 2. **Pagination**
- Limite par défaut : 20 notifications
- Offset-based pagination
- Compteur total optimisé

#### 3. **Connection Tracking**
- Map en mémoire : `userId → Set<socketId>`
- Nettoyage automatique à la déconnexion
- Monitoring des connexions actives

#### 4. **Requêtes optimisées**
```typescript
// Compteur non lus (1 requête)
const count = await prisma.notification.count({
  where: { userId, isRead: false }
});

// Notifications avec pagination (1 requête)
const notifications = await prisma.notification.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  skip: (page - 1) * limit,
  take: limit
});
```

### Optimisations Frontend

#### 1. **React Query Cache**
```typescript
// Cache 5 minutes
staleTime: 5 * 60 * 1000

// Refetch automatique
refetchInterval: 30000 // 30 secondes
```

#### 2. **WebSocket Reconnection**
```typescript
reconnection: true,
reconnectionAttempts: 5,
reconnectionDelay: 1000
```

#### 3. **Lazy Loading**
- Composants chargés à la demande
- Skeleton loading pour UX fluide
- Infinite scroll optionnel

#### 4. **Optimistic Updates**
```typescript
// Marquer comme lu immédiatement
onMutate: async (notificationId) => {
  await queryClient.cancelQueries(['notifications']);
  
  const previousData = queryClient.getQueryData(['notifications']);
  
  queryClient.setQueryData(['notifications'], (old) => ({
    ...old,
    notifications: old.notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    )
  }));
  
  return { previousData };
}
```

---

## 🐛 Troubleshooting

### Problèmes courants

#### 1. **WebSocket ne se connecte pas**

**Symptômes:**
- Badge ne se met pas à jour en temps réel
- Console : "WebSocket connection failed"

**Solutions:**
```bash
# Vérifier que le backend est démarré
npm run dev

# Vérifier les variables d'environnement
echo $FRONTEND_URL  # Backend
echo $NEXT_PUBLIC_WS_URL  # Frontend

# Vérifier le token JWT
localStorage.getItem('accessToken')

# Logs backend
# Chercher : "User {userId} connected with socket {socketId}"
```

---

#### 2. **Notifications non reçues**

**Symptômes:**
- Notification créée en DB mais pas affichée

**Solutions:**
```typescript
// Vérifier que le gateway est appelé
this.notificationsGateway.sendNotificationToUser(userId, notification);

// Vérifier que l'utilisateur est connecté
const isConnected = this.notificationsGateway.isUserConnected(userId);

// Logs backend
// Chercher : "Notification sent to user {userId}"
```

---

#### 3. **Badge ne se met pas à jour**

**Symptômes:**
- Compteur reste à 0 ou ne change pas

**Solutions:**
```typescript
// Vérifier le hook
const { data } = useUnreadCount();
console.log('Unread count:', data?.count);

// Forcer le refetch
queryClient.invalidateQueries(['notifications', 'unread-count']);

// Vérifier le WebSocket
socket.on('unread-count-updated', ({ count }) => {
  console.log('Count updated:', count);
});
```

---

#### 4. **Erreur 401 Unauthorized**

**Symptômes:**
- Requêtes API échouent avec 401

**Solutions:**
```typescript
// Vérifier le token
const token = localStorage.getItem('accessToken');
console.log('Token:', token);

// Vérifier l'expiration
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Expires:', new Date(payload.exp * 1000));

// Refresh le token
await authService.refreshToken();
```

---

#### 5. **Performance lente**

**Symptômes:**
- Liste de notifications lente à charger

**Solutions:**
```sql
-- Vérifier les indexes
EXPLAIN ANALYZE 
SELECT * FROM "Notification" 
WHERE "userId" = 'xxx' AND "isRead" = false 
ORDER BY "createdAt" DESC;

-- Créer les indexes manquants
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" 
ON "Notification"("userId", "isRead");
```

---

## 📚 Exemples

### Exemple 1 : Créer une notification personnalisée

```typescript
// Backend - Dans un service
async sendCustomNotification(userId: string, message: string) {
  const notification = await this.notificationsService.createNotification({
    userId,
    type: NotificationType.SYSTEM_ANNOUNCEMENT,
    title: 'Annonce importante',
    message,
    metadata: {
      priority: 'high',
      category: 'system'
    }
  });

  // Envoyer en temps réel
  this.notificationsGateway.sendNotificationToUser(userId, notification);
  
  return notification;
}
```

---

### Exemple 2 : Notification avec action personnalisée

```typescript
// Frontend - Composant personnalisé
function CustomNotificationItem({ notification }) {
  const handleCustomAction = async () => {
    if (notification.metadata?.actionUrl) {
      router.push(notification.metadata.actionUrl);
    }
    
    await markAsRead(notification.id);
  };

  return (
    <div className="notification-item">
      <h3>{notification.title}</h3>
      <p>{notification.message}</p>
      
      {notification.metadata?.actionLabel && (
        <button onClick={handleCustomAction}>
          {notification.metadata.actionLabel}
        </button>
      )}
    </div>
  );
}
```

---

### Exemple 3 : Notifications groupées

```typescript
// Backend - Envoyer à plusieurs utilisateurs
async notifyMultipleUsers(userIds: string[], notification: CreateNotificationDto) {
  const notifications = await Promise.all(
    userIds.map(userId =>
      this.notificationsService.createNotification({
        ...notification,
        userId
      })
    )
  );

  // Envoyer en temps réel à tous
  notifications.forEach((notif, index) => {
    this.notificationsGateway.sendNotificationToUser(
      userIds[index],
      notif
    );
  });

  return notifications;
}
```

---

### Exemple 4 : Notification avec délai (reminder)

```typescript
// Backend - Scheduler avec cron
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationScheduler {
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyReminders() {
    const usersWithPendingTasks = await this.prisma.user.findMany({
      where: {
        tasks: {
          some: {
            status: 'DRAFT',
            createdAt: {
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // > 24h
            }
          }
        }
      }
    });

    for (const user of usersWithPendingTasks) {
      await this.notificationsService.createNotification({
        userId: user.id,
        type: NotificationType.DEADLINE_REMINDER,
        title: 'Tâches en attente',
        message: 'Vous avez des tâches non soumises depuis plus de 24h',
      });
    }
  }
}
```

---

### Exemple 5 : Notification avec son (browser)

```typescript
// Frontend - Jouer un son pour les nouvelles notifications
function useNotificationSound() {
  const audioRef = useRef(new Audio('/notification-sound.mp3'));

  useEffect(() => {
    const socket = io(WS_URL, { auth: { token } });

    socket.on('new-notification', (notification) => {
      // Jouer le son
      audioRef.current.play().catch(console.error);
      
      // Afficher une notification navigateur
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png'
        });
      }
    });

    return () => socket.disconnect();
  }, []);
}
```

---

## 🚀 Roadmap

### Fonctionnalités futures

- [ ] **Push notifications** : Notifications navigateur natives
- [ ] **Email notifications** : Envoi d'emails pour notifications importantes
- [ ] **Notification preferences** : Paramètres utilisateur (types, fréquence)
- [ ] **Notification groups** : Grouper les notifications similaires
- [ ] **Rich notifications** : Images, boutons d'action, etc.
- [ ] **Notification history** : Archive des anciennes notifications
- [ ] **Analytics** : Statistiques sur les notifications (taux de lecture, etc.)
- [ ] **Mobile app** : Support React Native avec push notifications

---

## 📖 Références

### Documentation externe
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)

### Code source
- Backend: `apps/api/src/notifications/`
- Frontend: `apps/frontend/src/components/notifications/`
- Types: `apps/frontend/src/types/notifications.ts`
- Hooks: `apps/frontend/src/hooks/useNotifications.ts`

---

## 👥 Support

Pour toute question ou problème :
- 📧 Email : support@atw-timesheet.com
- 💬 Slack : #notifications-support
- 🐛 Issues : GitHub Issues

---

**🎉 Le système de notifications est maintenant opérationnel et prêt pour la production !**
