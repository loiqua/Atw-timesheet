/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  username: string | null;
}

interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

describe('Timesheet e2e', () => {
  let app: INestApplication;
  let server: any;
  let prisma: PrismaService;

  const SUFFIX = Date.now();
  const RAND = Math.random().toString(36).slice(2, 8);

  let user: {
    email: string;
    fullName: string;
    username: string;
    password: string;
  };
  let admin: {
    email: string;
    fullName: string;
    username: string;
    password: string;
  };

  let userToken: string;
  let adminToken: string;
  let domainId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    server = app.getHttpServer();

    prisma = app.get(PrismaService);

    // Create a domain for tests (unique per run)
    const domain = await prisma.domain.create({
      data: {
        name: `Timesheet E2E ${SUFFIX}-${RAND}`,
        slug: `timesheet-e2e-${SUFFIX}-${RAND}`,
      },
    });
    domainId = domain.id;

    user = {
      email: `ts-user+${SUFFIX}-${RAND}@example.com`,
      fullName: 'TS User',
      username: `tsuser_${SUFFIX}_${RAND}`,
      password: 'Password1!',
    };

    admin = {
      email: `ts-admin+${SUFFIX}-${RAND}@example.com`,
      fullName: 'TS Admin',
      username: `tsadmin_${SUFFIX}_${RAND}`,
      password: 'Password1!',
    };

    // Register normal user
    {
      const res: Response = await request(server)
        .post('/auth/register')
        .send({ ...user, domainId })
        .expect(201);
      const body = res.body as RegisterResponse;
      userToken = body.tokens.accessToken;
    }

    // Register admin and promote to ADMIN directly in DB (bypass adminKey for tests)
    {
      const res: Response = await request(server)
        .post('/auth/register')
        .send({ ...admin, domainId })
        .expect(201);
      const body = res.body as RegisterResponse;
      await prisma.user.update({
        where: { id: body.user.id },
        data: { role: 'ADMIN' },
      });
      // login as admin to get fresh token with ADMIN role in payload
      const loginRes: Response = await request(server)
        .post('/auth/login')
        .send({ emailOrUsername: admin.email, password: admin.password })
        .expect(200);
      const loginBody = loginRes.body as LoginResponse;
      adminToken = loginBody.tokens.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create, submit, approve a task and fetch PDF', async () => {
    // Create task as user
    const createRes: Response = await request(server)
      .post('/timesheet/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        domainId,
        title: 'Prospection',
        description: 'Appels sortants',
        date: new Date().toISOString(),
        durationMin: 45,
        reportType: 'STANDARD',
        reportCategory: 'Call Center',
        reportContent: { calls: 12, success: 3 },
      })
      .expect(201);
    const taskId: string = (createRes.body as { id: string }).id;

    // Submit
    await request(server)
      .post(`/timesheet/tasks/${taskId}/submit`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    // Approve as admin
    await request(server)
      .post(`/timesheet/tasks/${taskId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'OK' })
      .expect(200);

    // Get PDF
    const pdfRes: Response = await request(server)
      .get(`/timesheet/tasks/${taskId}/pdf`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const pdfBody = pdfRes.body as { contentType: string; data: string };
    expect(pdfBody.contentType).toBe('application/pdf');
    expect(typeof pdfBody.data).toBe('string');
    expect(pdfBody.data.length).toBeGreaterThan(100);
  });
});
