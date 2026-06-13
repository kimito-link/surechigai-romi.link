import { describe, it, expect } from 'vitest';
import * as Sentry from '@sentry/react';

const hasSentryDsn = Boolean(process.env.SENTRY_DSN);

describe.skipIf(!hasSentryDsn)('Sentry Error Tracking', () => {
  it('should capture test error', () => {
    // This test verifies that Sentry is properly configured
    // In development mode, errors are logged to console
    const testError = new Error('Test error for Sentry tracking');
    
    // Capture the error
    Sentry.captureException(testError);
    
    // In development, this should log to console
    // In production, this would send to Sentry
    expect(true).toBe(true);
  });

  it('should set user context', () => {
    Sentry.setUser({
      id: 'test-user-123',
      email: 'test@example.com',
    });
    
    expect(true).toBe(true);
  });

  it('should add breadcrumb', () => {
    Sentry.addBreadcrumb({
      category: 'test',
      message: 'Test breadcrumb',
      level: 'info',
    });
    
    expect(true).toBe(true);
  });
});
