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
  username: string;
}

interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

describe('Auth e2e', () => {
  let app: INestApplication;
  let server: any;
  let accessToken: string;
  let refreshToken: string;
  let userId: string;
  let domainId: string;

  const SUFFIX = Date.now();
  const user = {
    email: `testuser+${SUFFIX}@example.com`,
    fullName: 'Test User',
    username: `testuser_${SUFFIX}`,
    password: 'Password1!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    server = app.getHttpServer();

    // Create a test domain to attach to the user (guards future requirements)
    const prisma = app.get(PrismaService);
    const d = await prisma.domain.create({
      data: { name: `Auth E2E ${SUFFIX}`, slug: `auth-e2e-${SUFFIX}` },
    });
    domainId = d.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register a new user', async () => {
    const res: Response = await request(server)
      .post('/auth/register')
      .send({ ...user, domainId })
      .expect(201);
    const body = res.body as RegisterResponse;
    expect(body.user.email).toBe(user.email);
    expect(body.tokens.accessToken).toBeDefined();
    expect(body.tokens.refreshToken).toBeDefined();
    userId = body.user.id;
    accessToken = body.tokens.accessToken;
    refreshToken = body.tokens.refreshToken;
  });

  it('should not register with same email', async () => {
    await request(server).post('/auth/register').send(user).expect(409);
  });

  it('should login with email', async () => {
    const res: Response = await request(server)
      .post('/auth/login')
      .send({ emailOrUsername: user.email, password: user.password })
      .expect(200);
    const body = res.body as LoginResponse;
    expect(body.user.email).toBe(user.email);
    expect(body.tokens.accessToken).toBeDefined();
    expect(body.tokens.refreshToken).toBeDefined();
    accessToken = body.tokens.accessToken;
    refreshToken = body.tokens.refreshToken;
  });

  it('should login with username', async () => {
    const res: Response = await request(server)
      .post('/auth/login')
      .send({ emailOrUsername: user.username, password: user.password })
      .expect(200);
    const body = res.body as LoginResponse;
    expect(body.user.username).toBe(user.username);
    expect(body.tokens.accessToken).toBeDefined();
    expect(body.tokens.refreshToken).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    await request(server)
      .post('/auth/login')
      .send({ emailOrUsername: user.email, password: 'WrongPass1!' })
      .expect(401);
  });

  it('should access protected profile with JWT', async () => {
    const res: Response = await request(server)
      .get('/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = res.body as User;
    expect(body.email).toBe(user.email);
  });

  it('should not access profile without JWT', async () => {
    await request(server).get('/auth/profile').expect(401);
  });

  it('should refresh tokens', async () => {
    const res: Response = await request(server)
      .post('/auth/refresh')
      .send({ userId, refreshToken })
      .expect(200);
    const body = res.body as RefreshResponse;
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    accessToken = body.accessToken;
    refreshToken = body.refreshToken;
  });

  it('should logout and revoke refresh token', async () => {
    await request(server).post('/auth/logout').send({ userId }).expect(200);
  });

  it('should not refresh tokens after logout', async () => {
    await request(server)
      .post('/auth/refresh')
      .send({ userId, refreshToken })
      .expect(401);
  });
});
