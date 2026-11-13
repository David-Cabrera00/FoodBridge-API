const assert = require('node:assert/strict');
const { connectDemo, seedNotification } = require('./demo-db.cjs');
const base = 'http://127.0.0.1:3000';
const operations = [
  ['post', '/auth/register', 201],
  ['post', '/auth/login', 200],
  ['post', '/categories', 201],
  ['post', '/establishments', 201],
  ['post', '/food-publications', 201],
  ['get', '/food-publications/{id}', 200],
  ['post', '/requests', 201],
  ['put', '/requests/{id}/accept', 200],
  ['post', '/pickups', 201],
  ['put', '/notifications/users/{userId}/{id}/read', 200],
];
async function call(index, route, body) {
  const [method, , expected] = operations[index];
  const response = await fetch(base + route, {
    method: method.toUpperCase(),
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  assert.equal(
    response.status,
    expected,
    `${method} ${route}: ${JSON.stringify(result)}`,
  );
  console.log(
    `${index + 1}. ${method.toUpperCase()} ${route} -> ${response.status} ${JSON.stringify(result)}`,
  );
  return result;
}
async function main() {
  const db = await connectDemo();
  try {
    const ui = await fetch(base + '/docs');
    assert.equal(ui.status, 200);
    assert((await ui.text()).includes('swagger-ui'));
    const document = await fetch(base + '/docs-json');
    assert.equal(document.status, 200);
    const spec = await document.json();
    for (const [method, route, status] of operations) {
      const op = spec.paths[route]?.[method];
      assert(op, `Missing operation: ${method} ${route}`);
      assert(op.responses[status], `Missing response: ${status}`);
      if (method !== 'get') {
        const schema = op.requestBody?.content?.['application/json']?.schema;
        assert(schema, `Missing requestBody: ${route}`);
        const model = schema.$ref
          ? spec.components.schemas[schema.$ref.split('/').pop()]
          : schema;
        assert(
          Object.keys(model.properties).length > 0,
          `Empty schema: ${route}`,
        );
      }
      for (const match of route.matchAll(/\{(\w+)\}/g)) {
        assert(
          op.parameters.some(
            (p) => p.name === match[1] && p.in === 'path' && p.required,
          ),
          `Missing path parameter: ${match[1]}`,
        );
      }
    }
    console.log(
      'Swagger UI HTTP 200; OpenAPI HTTP 200; 10 operations, bodies, schemas and path parameters verified.',
    );
    const email = `ensayo.${Date.now()}@example.test`;
    const password = 'DemoFoodBridge2026!';
    const registered = await call(0, '/auth/register', {
      name: 'Ensayo FoodBridge',
      email,
      password,
    });
    assert(!JSON.stringify(registered).toLowerCase().includes('password'));
    const userId = registered.user.id;
    assert.equal(
      (await db.query('SELECT id FROM users WHERE id=$1', [userId])).rows
        .length,
      1,
      'API is not connected to this demo database',
    );
    // Off-camera setup immediately after registration, outside the ten calls.
    const notification = await seedNotification(db, userId);
    const login = await call(1, '/auth/login', { email, password });
    assert.equal(login.user.id, userId);
    assert(!JSON.stringify(login).toLowerCase().includes('password'));
    const category = await call(2, '/categories', {
      name: 'Frutas demo',
      description: 'Alimentos ficticios',
    });
    const establishment = await call(3, '/establishments', {
      name: 'Restaurante Demo',
      type: 'restaurant',
      address: 'Calle Demo 123',
      phone: '3000000000',
      email: 'local@example.test',
    });
    const publication = await call(4, '/food-publications', {
      establishmentId: establishment.id,
      categoryId: category.id,
      title: 'Canasta demo',
      description: 'Frutas para demostracion',
      quantity: 10,
      unit: 'kg',
      expirationDate: '2026-12-02T18:00:00-05:00',
    });
    assert.equal(publication.categoryId, category.id);
    assert.equal(publication.establishmentId, establishment.id);
    const found = await call(5, `/food-publications/${publication.id}`);
    assert.deepEqual(found, publication);
    const request = await call(6, '/requests', {
      userId,
      foodPublicationId: publication.id,
      quantity: 2,
    });
    assert.equal(request.status, 'pending');
    assert.equal(request.userId, userId);
    assert.equal(request.foodPublicationId, publication.id);
    assert.equal(request.quantity, 2);
    const accepted = await call(7, `/requests/${request.id}/accept`, {
      status: 'accepted',
    });
    assert.equal(accepted.id, request.id);
    assert.equal(accepted.status, 'accepted');
    const pickup = await call(8, '/pickups', {
      requestId: request.id,
      scheduledAt: '2026-12-01T15:00:00-05:00',
    });
    assert.equal(pickup.requestId, request.id);
    assert.equal(pickup.status, 'scheduled');
    const read = await call(
      9,
      `/notifications/users/${userId}/${notification.id}/read`,
      { isRead: true },
    );
    assert.equal(read.id, notification.id);
    assert.equal(read.userId, userId);
    assert.equal(read.isRead, true);
    assert.equal(
      (
        await db.query('SELECT "isRead" FROM notifications WHERE id=$1', [
          read.id,
        ])
      ).rows[0].isRead,
      true,
    );
    console.log(
      'PASS: 10 calls against the same isolated PostgreSQL database. Video email remains unused: video.foodbridge@example.test',
    );
  } finally {
    await db.end();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
