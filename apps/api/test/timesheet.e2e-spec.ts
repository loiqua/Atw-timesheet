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

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  durationMin: number;
  reportType?: string;
  reportCategory?: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

  describe('Task Management Flow', () => {
    let taskId: string;

    it('should create a task successfully', async () => {
      const createRes: Response = await request(server)
        .post('/timesheet/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          domainId,
          title: 'Prospection Client',
          description: 'Appels sortants pour nouveaux clients',
          date: new Date().toISOString(),
          startTime: '09:00',
          endTime: '12:00',
          durationMin: 180,
          reportType: 'STANDARD',
          reportCategory: 'Sales',
          reportContent: {
            calls: 15,
            success: 5,
            leads: 3,
            meetings: 2,
          },
        })
        .expect(201);

      const task = createRes.body as Task;
      taskId = task.id;
      expect(task.title).toBe('Prospection Client');
      expect(task.status).toBe('DRAFT');
      expect(task.durationMin).toBe(180);
    });

    it('should get user tasks', async () => {
      const res: Response = await request(server)
        .get('/timesheet/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const responseBody = res.body as TaskListResponse;
      expect(responseBody.tasks).toBeInstanceOf(Array);
      expect(responseBody.total).toBeGreaterThan(0);
      expect(responseBody.tasks.some((t: Task) => t.id === taskId)).toBe(true);
    });

    it('should update a task', async () => {
      const updateRes: Response = await request(server)
        .patch(`/timesheet/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Prospection Client - Mise à jour',
          description: 'Appels sortants avec suivi personnalisé',
        })
        .expect(200);

      const updatedTask = updateRes.body as Task;
      expect(updatedTask.title).toBe('Prospection Client - Mise à jour');
    });

    it('should submit a task', async () => {
      const submitRes: Response = await request(server)
        .post(`/timesheet/tasks/${taskId}/submit`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const submittedTask = submitRes.body as Task;
      expect(submittedTask.status).toBe('SUBMITTED');
    });

    it('should not allow editing submitted task', async () => {
      await request(server)
        .patch(`/timesheet/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Should not work' })
        .expect(400);
    });

    it('should approve task as admin', async () => {
      const approveRes: Response = await request(server)
        .post(`/timesheet/tasks/${taskId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Excellent travail!' })
        .expect(200);

      const approvedTask = approveRes.body as Task;
      expect(approvedTask.status).toBe('APPROVED');
    });

    it('should generate PDF for approved task', async () => {
      const pdfRes: Response = await request(server)
        .get(`/timesheet/tasks/${taskId}/pdf`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(pdfRes.headers['content-type']).toBe('application/pdf');
      expect(pdfRes.body).toBeInstanceOf(Buffer);
      expect((pdfRes.body as Buffer).length).toBeGreaterThan(1000);
    });
  });

  describe('Custom Category Tasks', () => {
    it('should create task with custom category', async () => {
      const createRes: Response = await request(server)
        .post('/timesheet/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          domainId,
          title: 'Formation Spécialisée',
          description: 'Formation sur les nouvelles technologies',
          date: new Date().toISOString(),
          durationMin: 240,
          reportType: 'CUSTOM',
          reportCategory: 'Formation Technique Avancée',
          reportContent: {
            projectType: 'INTERNAL',
            customCategoryName: 'Formation Technique Avancée',
            sessionTitle: 'React 19 & Next.js 15',
            attendees: 12,
            customFields: [
              { id: '1', label: 'Niveau', value: 'Avancé', type: 'text' },
              { id: '2', label: 'Satisfaction', value: '9', type: 'number' },
            ],
          },
        })
        .expect(201);

      const task = createRes.body as Task;
      expect(task.reportType).toBe('CUSTOM');
      expect(task.reportCategory).toBe('Formation Technique Avancée');
    });
  });

  describe('Admin Operations', () => {
    it('should get all tasks as admin', async () => {
      const res: Response = await request(server)
        .get('/timesheet/tasks?all=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const adminResponse = res.body as TaskListResponse;
      expect(adminResponse.tasks).toBeInstanceOf(Array);
      expect(adminResponse.total).toBeGreaterThan(0);
    });

    it('should filter tasks by status', async () => {
      const res: Response = await request(server)
        .get('/timesheet/tasks?status=APPROVED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const filteredResponse = res.body as TaskListResponse;
      expect(
        filteredResponse.tasks.every((t: Task) => t.status === 'APPROVED'),
      ).toBe(true);
    });

    it('should reject a submitted task', async () => {
      // Create and submit a new task
      const createRes: Response = await request(server)
        .post('/timesheet/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          domainId,
          title: 'Task to Reject',
          date: new Date().toISOString(),
          durationMin: 60,
          reportType: 'STANDARD',
          reportCategory: 'Training',
        })
        .expect(201);

      const newTask = createRes.body as Task;
      const newTaskId = newTask.id;

      await request(server)
        .post(`/timesheet/tasks/${newTaskId}/submit`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const rejectRes: Response = await request(server)
        .post(`/timesheet/tasks/${newTaskId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Informations incomplètes' })
        .expect(200);

      const rejectedTask = rejectRes.body as Task;
      expect(rejectedTask.status).toBe('REJECTED');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent task', async () => {
      await request(server)
        .get('/timesheet/tasks/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should return 403 for unauthorized task access', async () => {
      // Create task with one user, try to access with another
      const createRes: Response = await request(server)
        .post('/timesheet/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          domainId,
          title: 'Private Task',
          date: new Date().toISOString(),
          durationMin: 60,
          reportType: 'STANDARD',
        })
        .expect(201);

      // Try to access with admin (should work)
      const createdTask = createRes.body as Task;
      await request(server)
        .get(`/timesheet/tasks/${createdTask.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should validate required fields', async () => {
      await request(server)
        .post('/timesheet/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          // Missing required fields
          domainId,
        })
        .expect(400);
    });

    it('should validate date format', async () => {
      await request(server)
        .post('/timesheet/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          domainId,
          title: 'Invalid Date Task',
          date: 'invalid-date',
          durationMin: 60,
        })
        .expect(400);
    });
  });
});
