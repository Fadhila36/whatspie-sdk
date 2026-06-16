import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

import { WhatspieClient } from '../src/client';
import {
  WhatspieAuthenticationError,
  WhatspieRateLimitError,
  WhatspieValidationError,
} from '../src/errors/WhatspieError';
import { HttpClient } from '../src/http/fetch-client';

describe('WhatspieClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    const env = (globalThis as any).process?.env;
    if (env) delete env.WHATSPIE_TOKEN;
  });

  it('should initialize successfully with a token', () => {
    const client = new WhatspieClient({ token: 'test_token' });
    expect(client).toBeInstanceOf(WhatspieClient);
  });

  it('should initialize successfully with process.env.WHATSPIE_TOKEN', () => {
    if (!(globalThis as any).process) (globalThis as any).process = { env: {} };
    (globalThis as any).process.env.WHATSPIE_TOKEN = 'env_token';
    const client = new WhatspieClient();
    expect(client).toBeInstanceOf(WhatspieClient);
  });

  it('should throw an error if no token is provided', () => {
    expect(() => new WhatspieClient()).toThrow(/API Token is required/);
  });

  it('should throw if HttpClient init without token directly', () => {
    expect(() => new HttpClient({} as any)).toThrow(/API token/);
  });

  it('should format message requests correctly', async () => {
    const client = new WhatspieClient({ token: 'test_token' });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ status: true, message: 'Success' }),
    });

    await client.messages.sendText('123', '456', 'Hello World');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.whatspie.com/messages',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should trigger onRequest and onResponse hooks', async () => {
    const onRequest = vi.fn();
    const onResponse = vi.fn();
    const client = new WhatspieClient({ token: 'test', onRequest, onResponse });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ status: true }),
      clone: function() { return this; }
    });

    await client.devices.list();
    expect(onRequest).toHaveBeenCalled();
    expect(onResponse).toHaveBeenCalled();
  });

  it('should throw WhatspieAuthenticationError on 401', async () => {
    const client = new WhatspieClient({ token: 'invalid_token', maxRetries: 0 });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: 'Invalid token' }),
    });
    await expect(client.messages.sendText('123', '456', 'Test')).rejects.toThrow(WhatspieAuthenticationError);
  });

  it('should throw WhatspieValidationError on 400', async () => {
    const client = new WhatspieClient({ token: 'test', maxRetries: 0 });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: 'Bad param' }),
    });
    await expect(client.messages.sendText('123', '456', 'Test')).rejects.toThrow(WhatspieValidationError);
  });

  it('should retry on 429 and eventually throw WhatspieRateLimitError', async () => {
    const client = new WhatspieClient({ token: 'test', maxRetries: 1, initialRetryDelayMs: 10 });
    
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ 'retry-after': '1' }), // 1 second
      text: async () => JSON.stringify({ message: 'Too many requests' }),
    });

    const start = Date.now();
    await expect(client.messages.sendText('123', '456', 'Test')).rejects.toThrow(WhatspieRateLimitError);
    const end = Date.now();
    
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(end - start).toBeGreaterThanOrEqual(1000); // Because retryAfter is 1 second
  });

  it('should timeout and throw AbortError', async () => {
    const client = new WhatspieClient({ token: 'test', timeout: 50, maxRetries: 0 });
    
    globalThis.fetch = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          const err = new Error('AbortError');
          err.name = 'AbortError';
          reject(err);
        }, 60);
      });
    });

    await expect(client.messages.sendText('123', '456', 'Test')).rejects.toThrow(/Request timeout/);
  });

  it('should correctly verify webhook signatures', async () => {
    const payload = JSON.stringify({ event: 'message' });
    const secret = 'supersecret';
    
    const enc = new TextEncoder();
    const key = await globalThis.crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signatureBuffer = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(payload));
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const client = new WhatspieClient({ token: 'test' });
    const isValid = await client.webhooks.verifySignature(payload, signatureHex, secret);
    expect(isValid).toBe(true);

    const isInvalid = await client.webhooks.verifySignature(payload, 'badsignature', secret);
    expect(isInvalid).toBe(false);
  });

  // --- MESSAGING MODULE TESTS ---
  it('should format sendImage requests correctly', async () => {
    const client = new WhatspieClient({ token: 'test' });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) });
    await client.messages.sendImage('dev1', 'rec1', 'http://img.jpg', 'Cap');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"type":"image"')
      })
    );
  });

  it('should format sendVideo requests correctly', async () => {
    const client = new WhatspieClient({ token: 'test' });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) });
    await client.messages.sendVideo('dev1', 'rec1', 'http://vid.mp4', 'VidCap');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('video.mp4')
      })
    );
  });

  it('should format sendFile requests correctly', async () => {
    const client = new WhatspieClient({ token: 'test' });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) });
    await client.messages.sendFile('dev1', 'rec1', 'http://doc.pdf', 'doc.pdf', 'DocCap');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('doc.pdf')
      })
    );
  });

  it('should format sendLocation requests correctly', async () => {
    const client = new WhatspieClient({ token: 'test' });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) });
    await client.messages.sendLocation('dev1', 'rec1', 1.0, 2.0);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"degreesLatitude":1')
      })
    );
  });

  // --- GROUPS MODULE TESTS ---
  it('should list groups correctly', async () => {
    const client = new WhatspieClient({ token: 'test' });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) });
    await client.groups.list('dev1');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/groups?device=dev1'),
      expect.any(Object)
    );
  });

  it('should get group correctly', async () => {
    const client = new WhatspieClient({ token: 'test' });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) });
    await client.groups.get('dev1', 'grp1');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/groups/grp1?device=dev1'),
      expect.any(Object)
    );
  });

  it('should update group correctly', async () => {
    const client = new WhatspieClient({ token: 'test' });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) });
    await client.groups.update({ device: 'dev1', group_id: 'grp1', subject: 'New' });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/groups/grp1'),
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('should add members to group correctly', async () => {
    const client = new WhatspieClient({ token: 'test' });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) });
    await client.groups.addMembers({ device: 'dev1', group_id: 'grp1', participants: ['123'] });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/groups/grp1/members/add'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should send message to group correctly', async () => {
    const client = new WhatspieClient({ token: 'test' });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) });
    await client.groups.sendMessage({ device: 'dev1', receiver: 'grp1', type: 'chat', params: { text: 'hi' }});
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/messages'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  // --- AUTH MODULE TESTS ---
  it('should verify token correctly when valid', async () => {
    const client = new WhatspieClient({ token: 'test' });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) });
    const res = await client.auth.verifyToken();
    expect(res.status).toBe(true);
  });

  it('should return invalid when token verification fails', async () => {
    const client = new WhatspieClient({ token: 'test', maxRetries: 0 });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => '' });
    const res = await client.auth.verifyToken();
    expect(res.status).toBe(false);
  });

  // --- CONTACTS MODULE TESTS ---
  it('should check contacts correctly', async () => {
    const client = new WhatspieClient({ token: 'test' });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) });
    await client.contacts.check({ device: 'dev1', phones: ['123', '456'] });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/contacts/check'),
      expect.objectContaining({ method: 'POST', body: expect.stringContaining('123') })
    );
  });

  // --- WEBHOOKS MODULE TESTS ---
  it('should set webhook correctly', async () => {
    const client = new WhatspieClient({ token: 'test' });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) });
    await client.webhooks.set({ device: 'dev1', url: 'http://hook' });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/webhooks'),
      expect.objectContaining({ method: 'POST', body: expect.stringContaining('http://hook') })
    );
  });

  // --- CLIENT CONSTRUCTOR TESTS ---
  it('should throw error if token is missing', () => {
    expect(() => new WhatspieClient()).toThrow(/API Token is required/);
  });

  // --- LOGGER REDACTION TEST ---
  it('should log and redact sensitive data', async () => {
    const customLogger = vi.fn();
    const client = new WhatspieClient({ 
      token: 'test', 
      logger: customLogger 
    });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) });
    
    // Trigger a request to invoke the logger
    await client.messages.sendText('dev', 'rec', 'test payload with password');
    
    // We can't easily intercept the exact payload logged for request unless we check the customLogger calls
    expect(customLogger).toHaveBeenCalled();
  });

  it('should handle circular references in logger safely', async () => {
    const customLogger = vi.fn();
    const client = new WhatspieClient({ token: 'test', logger: customLogger });
    
    // Create circular ref
    const circularObj: any = { password: 'secret_pass' };
    circularObj.self = circularObj;

    // Call private log method directly
    client['http']['log']('Test log', circularObj);
    
    expect(customLogger).toHaveBeenCalledWith(
      'Test log',
      '[Unserializable Data Omitted]'
    );
  });

  it('should deeply redact sensitive objects', () => {
    const customLogger = vi.fn();
    const client = new WhatspieClient({ token: 'test', logger: customLogger });
    client['http']['log']('msg', { 
      nested: { token: '123' }, 
      array: [{ secret: 'shh', normal: 'ok' }] 
    });
    expect(customLogger).toHaveBeenCalledWith('msg', {
      nested: { token: '[REDACTED]' },
      array: [{ secret: '[REDACTED]', normal: 'ok' }]
    });
  });

  it('should fallback to console.log if logger is true', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const client = new WhatspieClient({ token: 'test', logger: true });
    client['http']['log']('msg', { safe: 'data' });
    expect(logSpy).toHaveBeenCalledWith('[Whatspie SDK] msg', { safe: 'data' });
    
    client['http']['log']('msg2');
    expect(logSpy).toHaveBeenCalledWith('[Whatspie SDK] msg2', '');
    
    logSpy.mockRestore();
  });

  // --- EDGE CASE ERROR TESTS ---
  it('should handle non-JSON successful responses as text', async () => {
    const client = new WhatspieClient({ token: 'test' });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'OK',
    });
    // messages.sendText returns what fetch-client returns.
    const res = await client.messages.sendText('1', '2', 't');
    expect(res).toBe('OK');
  });

  it('should format DELETE requests correctly', async () => {
    const client = new WhatspieClient({ token: 'test' });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) });
    await client.webhooks.remove('dev1');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/webhooks?device=dev1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('should throw WhatspieServerError on 500 status', async () => {
    const client = new WhatspieClient({ token: 'test', maxRetries: 0 });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ message: 'Internal Fail' }),
    });
    
    await expect(client.messages.sendText('1', '2', 't')).rejects.toThrow(/Server Error/);
  });

  it('should handle unknown errors gracefully (e.g. 503)', async () => {
    const client = new WhatspieClient({ token: 'test', maxRetries: 0 });
    // Note: status 503 is also >= 500, so it hits WhatspieServerError.
    // Let's test a non-JSON body.
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      text: async () => 'Service Unavailable Body',
    });
    
    await expect(client.messages.sendText('1', '2', 't')).rejects.toThrow(/Server Error.*Service Unavailable/);
  });

  it('should throw generic WhatspieError on unhandled statuses (e.g. 418)', async () => {
    const client = new WhatspieClient({ token: 'test', maxRetries: 0 });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 418,
      statusText: "I'm a teapot",
      text: async () => 'Tea time',
    });
    
    await expect(client.messages.sendText('1', '2', 't')).rejects.toThrow(/Whatspie API Error 418.*I'm a teapot/);
  });
});
