import { describe, it, expect } from 'vitest';

const hasSentryDsn = Boolean(process.env.SENTRY_DSN);

describe.skipIf(!hasSentryDsn)('Sentry DSN Validation', () => {
  it('should have valid SENTRY_DSN format', () => {
    const sentryDsn = process.env.SENTRY_DSN!;
    expect(sentryDsn).toMatch(/^https:\/\/[a-f0-9]+@[a-z0-9.-]+\.sentry\.io\/[0-9]+$/);
  });

  it('should be able to parse SENTRY_DSN', () => {
    const sentryDsn = process.env.SENTRY_DSN!;
    const url = new URL(sentryDsn);
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toContain('sentry.io');
    expect(url.username).toMatch(/^[a-f0-9]+$/);
    expect(url.pathname).toMatch(/^\/[0-9]+$/);
  });
});
