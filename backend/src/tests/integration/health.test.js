import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

describe('GET /api/health', () => {
  it('should return 200 OK with service health details', async () => {
    const app = createApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('lifeledger-backend');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptimeSeconds');
  });

  it('should return 404 for unknown API endpoints', async () => {
    const app = createApp();
    const response = await request(app).get('/api/nonexistent-route-path');

    expect(response.status).toBe(404);
  });
});
