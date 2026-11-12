// Run after npm.cmd run build. Requires a fresh, dedicated temporary cluster
// at .tmp/pg-verification, port 55439, database foodbridge_verification.
// Refuses other servers and nonempty databases before enabling schema sync.
const assert = require('node:assert/strict');
const path = require('node:path');
const { Client } = require('pg');
const { Test } = require('@nestjs/testing');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { DataSource } = require('typeorm');
const request = require('supertest');
require('reflect-metadata');

const { RequestsModule } = require('../../dist/requests/requests.module');
const { PickupsModule } = require('../../dist/pickups/pickups.module');
const {
  NotificationsModule,
} = require('../../dist/notifications/notifications.module');
const { User } = require('../../dist/users/entities/user.entity');
const {
  FoodPublication,
} = require('../../dist/food-publications/entities/food-publication.entity');
const {
  Establishment,
} = require('../../dist/establishments/entities/establishment.entity');
const { Category } = require('../../dist/categories/entities/category.entity');
const { Request } = require('../../dist/requests/entities/request.entity');
const { Pickup } = require('../../dist/pickups/entities/pickup.entity');
const {
  Notification,
} = require('../../dist/notifications/entities/notification.entity');

const connection = {
  host: '127.0.0.1',
  port: 55439,
  user: 'foodbridge_test',
  database: 'foodbridge_verification',
  connectionTimeoutMillis: 3000,
};

async function main() {
  const probe = new Client(connection);
  await probe.connect();
  try {
    const {
      rows: [server],
    } = await probe.query(
      "SELECT current_setting('data_directory') AS directory, current_setting('port') AS port, current_database() AS database",
    );
    assert.equal(
      path.resolve(server.directory).toLowerCase(),
      path.resolve(__dirname, '../../.tmp/pg-verification').toLowerCase(),
    );
    assert.equal(server.port, '55439');
    assert.equal(server.database, connection.database);
    const {
      rows: [tables],
    } = await probe.query(
      "SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'",
    );
    assert.equal(
      tables.count,
      0,
      'Only a fresh empty test database is permitted',
    );
    console.log(
      'Isolation confirmed: dedicated cluster, port 55439, empty test database',
    );
  } finally {
    await probe.end();
  }

  const module = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: connection.host,
        port: connection.port,
        username: connection.user,
        database: connection.database,
        entities: [
          User,
          FoodPublication,
          Establishment,
          Category,
          Request,
          Pickup,
          Notification,
        ],
        synchronize: true,
      }),
      RequestsModule,
      PickupsModule,
      NotificationsModule,
    ],
  }).compile();
  const app = module.createNestApplication();
  let checks = 0;
  try {
    await app.init();
    const db = app.get(DataSource);
    const api = request(app.getHttpServer());
    const check = async (response, status) => {
      const result = await response.expect(status);
      checks++;
      assert.ok(!JSON.stringify(result.body).includes('private-test-password'));
      return result.body;
    };
    const missing = '550e8400-e29b-41d4-a716-446655449999';
    const users = db.getRepository(User);
    const user = await users.save(
      users.create({
        name: 'Test',
        email: 'test@example.invalid',
        password: 'private-test-password',
      }),
    );
    const other = await users.save(
      users.create({
        name: 'Other',
        email: 'other@example.invalid',
        password: 'private-test-password',
      }),
    );
    const category = await db
      .getRepository(Category)
      .save({ name: 'Test', description: 'Isolated test' });
    const establishment = await db
      .getRepository(Establishment)
      .save({
        name: 'Test',
        type: 'Test',
        address: 'Test',
        phone: '0',
        email: 'store@example.invalid',
      });
    const publication = await db.getRepository(FoodPublication).save({
      establishmentId: establishment.id,
      categoryId: category.id,
      title: 'Test food',
      quantity: 10,
      unit: 'kg',
      status: 'available',
    });
    const body = {
      userId: user.id,
      foodPublicationId: publication.id,
      quantity: 1.5,
    };
    const created = await check(api.post('/requests').send(body), 201);
    assert.equal(created.status, 'pending');
    assert.equal((await check(api.get('/requests'), 200)).length, 1);
    await check(api.get(`/requests/${created.id}`), 200);
    await check(
      api.put(`/requests/${created.id}`).send({ quantity: 2.5 }),
      200,
    );
    assert.equal(
      (await db.getRepository(Request).findOneByOrFail({ id: created.id }))
        .quantity,
      2.5,
    );
    await check(
      api.put(`/requests/${created.id}/accept`).send({ status: 'accepted' }),
      200,
    );
    assert.equal(
      (await db.getRepository(Request).findOneByOrFail({ id: created.id }))
        .status,
      'accepted',
    );
    await check(
      api.put(`/requests/${created.id}/reject`).send({ status: 'rejected' }),
      200,
    );
    assert.equal(
      (await db.getRepository(Request).findOneByOrFail({ id: created.id }))
        .status,
      'rejected',
    );
    await check(
      api.put(`/requests/${created.id}/accept`).send({ status: 'rejected' }),
      400,
    );
    await check(api.get('/requests/bad'), 400);
    await check(api.get(`/requests/${missing}`), 404);
    await check(api.post('/requests').send({ ...body, quantity: 0 }), 400);
    await check(
      api.post('/requests').send({ ...body, status: 'accepted' }),
      400,
    );
    await check(api.post('/requests').send({ ...body, userId: missing }), 404);
    await check(
      api.post('/requests').send({ ...body, foodPublicationId: missing }),
      404,
    );

    // Exercise actual PostgreSQL failures in this exclusive disposable schema.
    await db.query(
      'ALTER TABLE requests ADD CONSTRAINT verification_quantity CHECK (quantity < 100)',
    );
    try {
      await check(api.post('/requests').send({ ...body, quantity: 100 }), 409);
    } finally {
      await db.query(
        'ALTER TABLE requests DROP CONSTRAINT verification_quantity',
      );
    }
    await db.query('ALTER TABLE requests RENAME TO verification_requests');
    try {
      await check(api.get('/requests'), 500);
    } finally {
      await db.query('ALTER TABLE verification_requests RENAME TO requests');
    }

    const pickup = await check(
      api
        .post('/pickups')
        .send({ requestId: created.id, scheduledAt: '2028-02-29T12:00:00Z' }),
      201,
    );
    await check(api.get('/pickups'), 200);
    await check(api.get(`/pickups/${pickup.id}`), 200);
    await check(
      api
        .put(`/pickups/${pickup.id}`)
        .send({
          scheduledAt: '2028-03-01T10:00:00-05:00',
          status: 'completed',
        }),
      200,
    );
    const storedPickup = await db
      .getRepository(Pickup)
      .findOneByOrFail({ id: pickup.id });
    assert.equal(storedPickup.status, 'completed');
    assert.equal(
      storedPickup.scheduledAt.toISOString(),
      '2028-03-01T15:00:00.000Z',
    );
    await check(api.get('/pickups/bad'), 400);
    await check(api.get(`/pickups/${missing}`), 404);
    await check(
      api
        .post('/pickups')
        .send({ requestId: missing, scheduledAt: '2028-01-01T00:00:00Z' }),
      404,
    );
    await check(
      api
        .post('/pickups')
        .send({ requestId: created.id, scheduledAt: '2026-02-30T12:00:00Z' }),
      400,
    );
    await check(
      api.put(`/pickups/${pickup.id}`).send({ status: 'invalid' }),
      400,
    );

    const notification = await db
      .getRepository(Notification)
      .save({ userId: user.id, title: 'Test', message: 'Test', isRead: false });
    const url = `/notifications/users/${user.id}`;
    assert.equal((await check(api.get(url), 200)).length, 1);
    await check(api.get(`${url}/${notification.id}`), 200);
    await check(
      api.put(`${url}/${notification.id}/read`).send({ isRead: true }),
      200,
    );
    assert.equal(
      (
        await db
          .getRepository(Notification)
          .findOneByOrFail({ id: notification.id })
      ).isRead,
      true,
    );
    await check(
      api.put(`${url}/${notification.id}/read`).send({ isRead: false }),
      200,
    );
    assert.equal(
      (
        await db
          .getRepository(Notification)
          .findOneByOrFail({ id: notification.id })
      ).isRead,
      false,
    );
    assert.deepEqual(
      await check(api.get(`/notifications/users/${other.id}`), 200),
      [],
    );
    await check(
      api.get(`/notifications/users/${other.id}/${notification.id}`),
      404,
    );
    await check(
      api
        .put(`/notifications/users/${other.id}/${notification.id}/read`)
        .send({ isRead: true }),
      404,
    );
    await check(api.get(`/notifications/users/${missing}`), 404);
    await check(api.get('/notifications/users/bad'), 400);
    await check(api.get(`${url}/bad`), 400);
    await check(api.get(`${url}/${missing}`), 404);
    await check(
      api.put(`${url}/${notification.id}/read`).send({ isRead: 'true' }),
      400,
    );
    await check(
      api
        .put(`${url}/${notification.id}/read`)
        .send({ isRead: true, userId: other.id }),
      400,
    );

    await check(api.delete(`/requests/${created.id}`), 200);
    assert.equal(
      await db.getRepository(Request).existsBy({ id: created.id }),
      false,
    );
    await check(api.get(`/requests/${created.id}`), 404);
    console.log(
      `PASS: ${checks} HTTP checks against real isolated PostgreSQL, plus persisted-state assertions`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
