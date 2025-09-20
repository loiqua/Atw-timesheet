# ATW Timesheet API

A comprehensive NestJS backend application for ATW Timesheet management with authentication, user management, and role-based access control.

## Features

- 🔐 **Authentication System**
  - User registration with email, username, and domain
  - Login with email or username
  - JWT tokens (access + refresh)
  - Password reset with secure tokens
- 👥 **User Management**
  - Role-based access control (USER, ADMIN, MANAGER)
  - User activation/deactivation
  - Role promotion and management
- 🛡️ **Security**
  - Password hashing with bcrypt
  - JWT authentication guards
  - Role-based route protection
  - Input validation with class-validator
- 📚 **API Documentation**
  - Swagger/OpenAPI documentation
  - Interactive API explorer at `/api`

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Passport.js + JWT
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## Description

ATW Timesheet API built with NestJS framework, providing robust authentication and user management capabilities.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

## Environment Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd atw-timesheet/apps/api
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Variables**
   Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/atw_timesheet?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="1h"

# Admin Registration
ADMIN_REGISTRATION_KEY="your-super-secret-and-long-key-here"

# Application
PORT=8000
```

## Admin User Registration

To register the first admin user, you need to provide a secret admin key during registration:

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPassword123!","fullName":"Jane Admin","adminKey":"your-secret-key"}'
```

**Note**: Replace `"your-secret-key"` with the actual `ADMIN_REGISTRATION_KEY` from your `.env` file.

## Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the application is running, visit:

- **Swagger UI**: `http://localhost:8000/api`
- **API Endpoints**: `http://localhost:8000`

## Testing

```bash
# Unit tests
npm run test

# Watch mode for tests
npm run test:watch

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user (optional adminKey for ADMIN role)
- `POST /auth/login` - Login user
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `GET /auth/profile` - Get user profile (protected)

### User Management

- `GET /users` - Get all users (Admin/Manager only)
- `GET /users/:id` - Get user by ID (Admin/Manager only)
- `PUT /users/:id/role` - Update user role (Admin only)
- `PUT /users/:id/activate` - Activate user (Admin only)
- `PUT /users/:id/deactivate` - Deactivate user (Admin only)

### Role Management (Roles module)

- `POST /roles/users/:userId/assignments` — Assign a role to a user (Admin only)
- `GET /roles/assignments` — List role assignments with pagination and filters (Admin only)
- `GET /roles/users/:userId/assignments` — Get active role assignments for a user (Admin only)
- `PATCH /roles/assignments/:assignmentId` — Update a role assignment (dates, scope, isActive) (Admin only)
- `DELETE /roles/assignments/:assignmentId` — Revoke a role assignment (Admin only)

Notes:
- Requires `Authorization: Bearer <accessToken>` of a user with `ADMIN` role.
- `:userId` and `:assignmentId` must be valid UUID v4 (server returns 400 otherwise).
- Date/time fields are ISO 8601 (timezone-aware). Backend stores `timestamptz` in UTC.
- Overlapping active assignments are prevented for identical `(userId, role, scope)`.

Pagination & Filters for `GET /roles/assignments`:
- Query params: `page` (default 1), `pageSize` (default 20), `userId`, `role` (ADMIN|MANAGER|EMPLOYEE), `active` (true|false)
- Response shape: `{ data: RoleAssignment[], total: number, page: number, pageSize: number }`

DB Model: see [`prisma/schema.prisma`](../prisma/schema.prisma), model `RoleAssignment` (composite index on `[userId, role, scope]`).

Swagger: open `http://localhost:8000/api` and use the "Role Management" tag.

#### cURL examples (Windows/cmd)

Set variables (optional):
```cmd
set TOKEN=<ACCESS_TOKEN_ADMIN>
set USER_ID=<USER_UUID>
```

Assign a role to a user:
```cmd
curl -X POST http://localhost:8000/roles/users/%USER_ID%/assignments ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"role\":\"MANAGER\",\"scope\":\"projectA\",\"validFrom\":\"2025-01-01T00:00:00Z\"}"
```

List assignments with pagination and filters:
```cmd
curl -X GET "http://localhost:8000/roles/assignments?page=1&pageSize=10&userId=%USER_ID%&role=MANAGER&active=true" ^
  -H "Authorization: Bearer %TOKEN%"
```

Get active assignments for a user:
```cmd
curl -X GET http://localhost:8000/roles/users/%USER_ID%/assignments ^
  -H "Authorization: Bearer %TOKEN%"
```

Update an assignment (e.g., add an end date):
```cmd
set ASSIGNMENT_ID=<ASSIGNMENT_UUID>
curl -X PATCH http://localhost:8000/roles/assignments/%ASSIGNMENT_ID% ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"validTo\":\"2025-12-31T23:59:59Z\"}"
```

Revoke an assignment:
```cmd
curl -X DELETE http://localhost:8000/roles/assignments/%ASSIGNMENT_ID% ^
  -H "Authorization: Bearer %TOKEN%"
```

Error cases to expect:
- 400 Bad Request: invalid UUID, invalid date range (`validFrom > validTo`), or overlapping active assignment
- 401 Unauthorized: missing/invalid Bearer token
- 403 Forbidden: user is not ADMIN
- 404 Not Found: target user or assignment does not exist

Source references:
- Controller: [`apps/api/src/roles/roles.controller.ts`](./src/roles/roles.controller.ts)
- Service: [`apps/api/src/roles/roles.service.ts`](./src/roles/roles.service.ts)
- DTOs: [`apps/api/src/roles/dto`](./src/roles/dto)

## User Roles

- **USER**: Basic access level (default for new users)
- **MANAGER**: Can view and manage users
- **ADMIN**: Full access, can promote users and manage all aspects
- **INFO_IT**: Technical/IT role (access management, support)

## Database Schema

The application uses the following main entities:

- **User**: Stores user information, credentials, and roles
- **Domain**: Predefined domains for user registration
- **Role**: Enum defining user permission levels (ADMIN, MANAGER, EMPLOYEE, INFO_IT)

## Development

### Project Structure

```
src/
├── auth/           # Authentication module
├── users/          # User management module
├── prisma/         # Database service
├── generated/      # Prisma generated client
└── main.ts         # Application entry point
```

### Adding New Features

1. Create a new module: `nest g module feature-name`
2. Add service: `nest g service feature-name`
3. Add controller: `nest g controller feature-name`
4. Update database schema in `prisma/schema.prisma`
5. Run migration: `npx prisma migrate dev`

### Scope-based authorization (per-project or per-team)

Some business endpoints may require a scoped role (e.g., a manager of a specific project). Use the provided decorator and guard:

- Decorator: `RequireScopedRole({ role, scopeParam })`
- Guard: `ScopeGuard`

How it works:
- The guard checks that the authenticated user has an active `RoleAssignment` with the required `role`, matching the scope value read from the route param named by `scopeParam`, and within valid date range (`validFrom` <= now < `validTo` or `validTo` is null), and `isActive = true`.

Usage example in a controller:
```ts
// src/projects/projects.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScopeGuard } from '../auth/guards/scope.guard';
import { RequireScopedRole } from '../auth/decorators/require-scoped-role.decorator';
import { Role } from '../../generated/prisma';

@Controller('projects')
@UseGuards(JwtAuthGuard, ScopeGuard)
export class ProjectsController {
  @Get(':projectId/overview')
  @RequireScopedRole({ role: Role.MANAGER, scopeParam: 'projectId' })
  getProjectOverview(@Param('projectId') projectId: string) {
    // only managers of this projectId can access
    return { projectId };
  }
}
```

Notes:
- Combine with `@Roles(Role.ADMIN)` if both global admin and scoped managers should be allowed (you can short-circuit the guard when `ADMIN`).
- Ensure your routes pass the scope identifier in `@Param('...')` with the exact `scopeParam` name.
- `RoleAssignment` overlaps are prevented by the service; use PATCH/DELETE endpoints to end or revoke roles.

Migration note for new role `INFO_IT`:
```bash
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate dev -n add-info-it-role --schema prisma/schema.prisma
```

## Troubleshooting

### Common Issues

- **Database connection**: Verify DATABASE_URL in .env
- **JWT errors**: Check JWT_SECRET is set
- **Migration issues**: Run `npx prisma migrate reset`
- **Port conflicts**: Change PORT in .env file

---

# Authentification API – Documentation Complète

## Stack Technique

- **Framework** : NestJS (TypeScript)
- **ORM** : Prisma
- **Base de données** : PostgreSQL
- **Sécurité** : JWT, bcrypt, Helmet, CORS, Throttler
- **Email** : @nestjs-modules/mailer, Nodemailer, Handlebars
- **Tests** : Jest, Supertest (e2e)

## Fonctionnalités

- Inscription (register)
- Connexion (login)
- Rafraîchissement de token (refresh)
- Déconnexion (logout)
- Mot de passe oublié (forgot-password)
- Réinitialisation du mot de passe (reset-password)
- Validation et logs sur toutes les actions critiques

## Sécurité

- Hashage des mots de passe avec bcrypt
- JWT pour l’authentification (access/refresh tokens)
- Middleware Helmet, CORS, Throttler
- Validation forte des DTOs (class-validator)
- Logs professionnels sur toutes les actions sensibles

## Variables d’environnement

Voir `.env.example` pour la configuration complète :

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/stage?schema=public
SMTP_HOST=live.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
SMTP_FROM=adresse_autorisee@mailtrap.io
JWT_SECRET=your_jwt_secret
ADMIN_REGISTRATION_KEY=your_admin_registration_key
```

## Endpoints

### POST /auth/register

- **Payload** : `{ email, fullName, username, password, adminKey? }`
- **Réponse** : `{ user, tokens }`

**Note**: To register an admin user, include the `adminKey` field with the secret key from your environment variables. Without the key, users are registered with the default `EMPLOYEE` role.

### POST /auth/login

- **Payload** : `{ emailOrUsername, password }`
- **Réponse** : `{ user, tokens }`

### POST /auth/forgot-password

- **Payload** : `{ email }`
- **Réponse** : `{ message }`

### POST /auth/reset-password

- **Payload** : `{ token, newPassword }`
- **Réponse** : `{ message }`

### POST /auth/refresh

- **Payload** : `{ refreshToken }`
- **Réponse** : `{ accessToken, refreshToken }`

### POST /auth/logout

- **Header** : `Authorization: Bearer <accessToken>`
- **Réponse** : `204 No Content`

## Exemples d’utilisation (Windows/cmd)

```cmd
curl -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" -d "{\"email\":\"testuser@example.com\",\"fullName\":\"Test User\",\"username\":\"testuser\",\"password\":\"Password1!\"}"

# Register admin user
curl -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\",\"fullName\":\"Admin User\",\"username\":\"admin\",\"password\":\"AdminPassword123!\",\"adminKey\":\"your-secret-key\"}"
```

## Tests

- Lancer tous les tests : `npm run test:e2e` dans `apps/api/`
- Les tests couvrent : inscription, connexion, refresh, reset password, etc.
- Fichier de test principal : `apps/api/test/auth.e2e-spec.ts`

## Configuration Email

- Utilise Mailtrap pour le développement (adresse d’expéditeur autorisée obligatoire)
- En production : utiliser un vrai SMTP (SendGrid, Mailgun, etc.) avec un domaine validé

## Limitations & TODO

- Gestion avancée des rôles avec attributions temporaires (voir module `roles`)
- Système de clé secrète pour l'inscription d'administrateurs

## Liens utiles

- [NestJS](https://docs.nestjs.com/)
- [Prisma](https://www.prisma.io/docs/)
- [Mailtrap](https://mailtrap.io/)
- [Jest](https://jestjs.io/)

---

Pour toute question, voir le code ou contacter le mainteneur.

## License

This project is [MIT licensed](LICENSE).

---

## 📁 Fichiers clés & extraits importants

- [`src/auth/auth.service.ts`](../src/auth/auth.service.ts) : logique principale d’authentification
  - Méthodes : [`register`](../src/auth/auth.service.ts#L23), [`login`](../src/auth/auth.service.ts#L61), [`forgotPassword`](../src/auth/auth.service.ts#L108), [`resetPassword`](../src/auth/auth.service.ts#L137)
- [`src/mail/mail.module.ts`](../src/mail/mail.module.ts) : configuration du module mailer (champ `from` dynamique)
- [`test/auth.e2e-spec.ts`](../test/auth.e2e-spec.ts) : tests d’intégration/e2e de l’authentification
- [`prisma/schema.prisma`](../prisma/schema.prisma) : schéma de la base de données (modèle User, champs `resetToken`, etc.)

### Exemple de méthode `register` ([auth.service.ts](../src/auth/auth.service.ts))

```ts
async register(registerDto: RegisterDto): Promise<{ user: UserResponse; tokens: { accessToken: string; refreshToken: string } }> {
  // Vérifie si l'utilisateur existe déjà
  const existingUser = await this.prisma.user.findFirst({
    where: {
      OR: [{ email }, ...(username ? [{ username }] : [])],
    },
  });
  if (existingUser) throw new ConflictException('User with this email or username already exists');
  // Hash le mot de passe
  const hashedPassword = await bcrypt.hash(password, 12);
  // Crée l'utilisateur
  const user = await this.prisma.user.create({ ... });
  // Génère et stocke les tokens
  const tokens = await this.generateTokens(user);
  // ...
  return { user, tokens };
}
```

### Extrait de configuration mailer ([mail.module.ts](../src/mail/mail.module.ts))

```ts
MailerModule.forRootAsync({
  useFactory: async () => ({
    // ...
    from: process.env.SMTP_FROM,
    // ...
  }),
});
```

### Test d’intégration forgot-password ([auth.e2e-spec.ts](../test/auth.e2e-spec.ts))

```ts
it('should request password reset', async () => {
  await request(server)
    .post('/auth/forgot-password')
    .send({ email: user.email })
    .expect(200)
    .expect((res) => {
      expect(res.body.message).toMatch(/reset link has been sent/i);
    });
});
```

### Modèle User (prisma/schema.prisma)

```prisma
model User {
  id               String   @id @default(uuid())
  email            String   @unique
  username         String?  @unique
  password         String
  resetToken       String?
  resetTokenExpiry DateTime?
  // ...
}
```
