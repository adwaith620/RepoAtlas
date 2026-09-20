import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';

describe('Health check', () => {
  it('should return ok: true for /api/health', async () => {
    const fastify = Fastify();
    fastify.get('/api/health', async () => ({ ok: true }));

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/health'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({ ok: true });
  });
});
