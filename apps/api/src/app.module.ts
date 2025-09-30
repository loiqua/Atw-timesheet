import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { DomainsModule } from './domains/domains.module';
import { TimesheetModule } from './timesheet/timesheet.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CalendarModule } from './calendar/calendar.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // ThrottlerModule avec un tableau de règles
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 secondes
        limit: 10, // 10 requêtes par TTL
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      // Charge l'env depuis apps/api/.env ET la racine du repo ../../.env
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    DomainsModule,
    TimesheetModule,
    DashboardModule,
    CalendarModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Active le rate-limit globalement
    },
  ],
})
export class AppModule {}
