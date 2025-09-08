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

# Application
PORT=8000
```

4. **Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed the database
npx prisma db seed
```

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
- `POST /auth/register` - Register a new user
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

## User Roles

- **USER**: Basic access level (default for new users)
- **MANAGER**: Can view and manage users
- **ADMIN**: Full access, can promote users and manage all aspects

## Database Schema

The application uses the following main entities:
- **User**: Stores user information, credentials, and roles
- **Domain**: Predefined domains for user registration
- **Role**: Enum defining user permission levels

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

## Troubleshooting

### Common Issues
- **Database connection**: Verify DATABASE_URL in .env
- **JWT errors**: Check JWT_SECRET is set
- **Migration issues**: Run `npx prisma migrate reset`
- **Port conflicts**: Change PORT in .env file

## License

This project is [MIT licensed](LICENSE).
