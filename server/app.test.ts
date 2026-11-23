import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { JsonStore } from './store.js';

describe('task API', () => {
  let databaseFile: string;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    databaseFile = resolve('server/data', `test-${randomUUID()}.json`);
    app = createApp({ store: new JsonStore(databaseFile) });
  });

  afterEach(async () => {
    await unlink(databaseFile).catch(() => undefined);
  });

  async function register(email = 'alex@example.com') {
    return request(app).post('/api/auth/register').send({
      name: 'Alex Morgan',
      email,
      password: 'strong-password'
    });
  }

  it('registers, authenticates and returns the current user', async () => {
    const registration = await register();
    expect(registration.status).toBe(201);
    expect(registration.body.user).toMatchObject({ name: 'Alex Morgan', email: 'alex@example.com' });
    expect(registration.body.user.passwordHash).toBeUndefined();

    const profile = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${registration.body.token}`);
    expect(profile.status).toBe(200);
    expect(profile.body.user.email).toBe('alex@example.com');
  });

  it('supports the complete owner-scoped task lifecycle', async () => {
    const owner = await register();
    const otherUser = await register('other@example.com');
    const ownerAuth = { Authorization: `Bearer ${owner.body.token}` };
    const otherAuth = { Authorization: `Bearer ${otherUser.body.token}` };

    const created = await request(app)
      .post('/api/tasks')
      .set(ownerAuth)
      .send({ title: 'Ship the dashboard', priority: 'high', dueDate: '2027-01-10' });
    expect(created.status).toBe(201);

    const hidden = await request(app).get('/api/tasks').set(otherAuth);
    expect(hidden.body.tasks).toHaveLength(0);

    const updated = await request(app)
      .patch(`/api/tasks/${created.body.task.id}`)
      .set(ownerAuth)
      .send({ status: 'completed' });
    expect(updated.body.task.status).toBe('completed');

    const forbiddenDelete = await request(app).delete(`/api/tasks/${created.body.task.id}`).set(otherAuth);
    expect(forbiddenDelete.status).toBe(404);

    const removed = await request(app).delete(`/api/tasks/${created.body.task.id}`).set(ownerAuth);
    expect(removed.status).toBe(204);
  });

  it('rejects invalid input and duplicate accounts', async () => {
    await register();
    expect((await register()).status).toBe(409);
    expect((await request(app).post('/api/auth/register').send({ name: 'A', email: 'bad', password: 'short' })).status).toBe(400);
    expect((await request(app).get('/api/tasks')).status).toBe(401);
  });
});

