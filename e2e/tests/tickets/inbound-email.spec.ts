import { test, expect, type APIResponse } from '@playwright/test';

const ENDPOINT = '/api/tickets/inbound-email';

const WEBHOOK_SECRET = 'test-inbound-webhook-secret-e2e';
const AUTH_HEADERS = { Authorization: `Bearer ${WEBHOOK_SECRET}` };

const uid = () => Math.random().toString(36).slice(2, 8);

function basePayload(overrides: Record<string, string> = {}) {
  return {
    from: 'customer@example.com',
    fromName: 'Alice Smith',
    subject: 'Keyboard is broken',
    text: 'My keyboard stopped working today.',
    ...overrides,
  };
}

async function expectTicketCreated(
  response: APIResponse,
  expectedSubject: string,
  expectedFromEmail: string,
) {
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(typeof body.id).toBe('number');
  expect(Number.isInteger(body.id)).toBe(true);
  expect(body.subject).toBe(expectedSubject);
  expect(body.fromEmail).toBe(expectedFromEmail);
  expect(body.status).toBe('OPEN');
  expect(typeof body.createdAt).toBe('string');
  return body;
}

// ---------------------------------------------------------------------------
// 1. Happy path — text body
// ---------------------------------------------------------------------------

test.describe('inbound-email — happy path (text body)', () => {
  test('returns 201 with ticket shape', async ({ request }) => {
    const payload = basePayload({ subject: `Text ticket ${uid()}` });
    const response = await request.post(ENDPOINT, { data: payload, headers: AUTH_HEADERS });
    await expectTicketCreated(response, payload.subject, payload.from);
  });

  test('id is a positive integer', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: basePayload({ subject: `ID check ${uid()}` }),
      headers: AUTH_HEADERS,
    });
    const body = await response.json();
    expect(body.id).toBeGreaterThan(0);
  });

  test('response does not contain duplicate flag', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: basePayload({ subject: `No dup flag ${uid()}` }),
      headers: AUTH_HEADERS,
    });
    const body = await response.json();
    expect(body.duplicate).toBeUndefined();
  });

  test('accepts an optional messageId without error', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { ...basePayload(), messageId: `msg-${uid()}` },
      headers: AUTH_HEADERS,
    });
    expect(response.status()).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 2. Happy path — html-only body
// ---------------------------------------------------------------------------

test.describe('inbound-email — happy path (html-only body)', () => {
  test('returns 201 when only html is provided', async ({ request }) => {
    const subject = `HTML-only ticket ${uid()}`;
    const response = await request.post(ENDPOINT, {
      data: { from: 'customer@example.com', fromName: 'Bob Jones', subject, html: '<p>My printer is on fire.</p>' },
      headers: AUTH_HEADERS,
    });
    await expectTicketCreated(response, subject, 'customer@example.com');
  });

  test('accepts both text and html in the same request', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: {
        from: 'customer@example.com',
        fromName: 'Carol White',
        subject: `Text+HTML ticket ${uid()}`,
        text: 'Plain-text version.',
        html: '<p>HTML version.</p>',
      },
      headers: AUTH_HEADERS,
    });
    expect(response.status()).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 3. Deduplication
// ---------------------------------------------------------------------------

test.describe('inbound-email — deduplication', () => {
  test('second identical messageId returns 200 with duplicate: true', async ({ request }) => {
    const messageId = `dedup-${uid()}`;
    const payload = { ...basePayload({ subject: `Dedup test ${uid()}` }), messageId };

    const first = await request.post(ENDPOINT, { data: payload, headers: AUTH_HEADERS });
    expect(first.status()).toBe(201);
    const firstBody = await first.json();

    const second = await request.post(ENDPOINT, { data: payload, headers: AUTH_HEADERS });
    expect(second.status()).toBe(200);

    const secondBody = await second.json();
    expect(secondBody.duplicate).toBe(true);
    expect(secondBody.id).toBe(firstBody.id);
  });

  test('payload without messageId is never deduplicated', async ({ request }) => {
    const payload = basePayload({ subject: `No-dedup ${uid()}` });

    const first = await request.post(ENDPOINT, { data: payload, headers: AUTH_HEADERS });
    const second = await request.post(ENDPOINT, { data: payload, headers: AUTH_HEADERS });

    expect(first.status()).toBe(201);
    expect(second.status()).toBe(201);
    expect((await second.json()).id).not.toBe((await first.json()).id);
  });
});

// ---------------------------------------------------------------------------
// 4. Validation errors → 400
// ---------------------------------------------------------------------------

test.describe('inbound-email — validation errors (400)', () => {
  test('missing from field returns 400', async ({ request }) => {
    const { from: _omit, ...payload } = basePayload();
    const response = await request.post(ENDPOINT, { data: payload, headers: AUTH_HEADERS });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(typeof body.error).toBe('string');
  });

  test('invalid from email returns 400 with descriptive error', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: basePayload({ from: 'not-an-email' }),
      headers: AUTH_HEADERS,
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe('A valid sender email is required.');
  });

  test('empty fromName returns 400 with descriptive error', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: basePayload({ fromName: '' }),
      headers: AUTH_HEADERS,
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe('Sender name is required.');
  });

  test('missing fromName returns 400', async ({ request }) => {
    const { fromName: _omit, ...payload } = basePayload();
    const response = await request.post(ENDPOINT, { data: payload, headers: AUTH_HEADERS });
    expect(response.status()).toBe(400);
  });

  test('empty subject returns 400 with descriptive error', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: basePayload({ subject: '' }),
      headers: AUTH_HEADERS,
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe('Subject is required.');
  });

  test('missing subject returns 400', async ({ request }) => {
    const { subject: _omit, ...payload } = basePayload();
    const response = await request.post(ENDPOINT, { data: payload, headers: AUTH_HEADERS });
    expect(response.status()).toBe(400);
  });

  test('missing both text and html returns 400 with descriptive error', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { from: 'customer@example.com', fromName: 'Alice Smith', subject: 'No body at all' },
      headers: AUTH_HEADERS,
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe('Either text or html body must be provided.');
  });

  test('empty request body returns 400', async ({ request }) => {
    const response = await request.post(ENDPOINT, { data: {}, headers: AUTH_HEADERS });
    expect(response.status()).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 5. Webhook secret authentication
// ---------------------------------------------------------------------------

test.describe('inbound-email — webhook secret authentication', () => {
  const validPayload = () => basePayload({ subject: `Auth test ${uid()}` });

  test('missing Authorization header returns 401', async ({ request }) => {
    const response = await request.post(ENDPOINT, { data: validPayload() });
    expect(response.status()).toBe(401);
    expect((await response.json()).error).toBe('Unauthorized.');
  });

  test('wrong Bearer secret returns 401', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: validPayload(),
      headers: { Authorization: 'Bearer totally-wrong-secret' },
    });
    expect(response.status()).toBe(401);
    expect((await response.json()).error).toBe('Unauthorized.');
  });

  test('raw secret without Bearer prefix is also accepted (returns 201)', async ({ request }) => {
    // The route strips "Bearer " when present but falls back to the raw header
    // value otherwise — so Authorization: <secret> and Authorization: Bearer
    // <secret> are both valid.
    const response = await request.post(ENDPOINT, {
      data: validPayload(),
      headers: { Authorization: WEBHOOK_SECRET },
    });
    expect(response.status()).toBe(201);
  });

  test('correct Authorization: Bearer header returns 201', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: validPayload(),
      headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
    });
    expect(response.status()).toBe(201);
  });

  test('correct X-Webhook-Secret header returns 201', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: validPayload(),
      headers: { 'X-Webhook-Secret': WEBHOOK_SECRET },
    });
    expect(response.status()).toBe(201);
  });
});
