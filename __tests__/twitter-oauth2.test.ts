import { describe, it, expect } from "vitest";

describe("Twitter OAuth 2.0 Configuration", () => {
  // These tests require environment variables that are only available in production
  // Skip in CI environment where secrets are not available
  const hasTwitterCredentials = !!process.env.TWITTER_CLIENT_ID && !!process.env.TWITTER_CLIENT_SECRET;

  it.skipIf(!hasTwitterCredentials)("should have TWITTER_CLIENT_ID configured", () => {
    const clientId = process.env.TWITTER_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId).not.toBe("");
    expect(clientId!.length).toBeGreaterThan(10);
    console.log("TWITTER_CLIENT_ID is configured:", clientId?.substring(0, 10) + "...");
  });

  it.skipIf(!hasTwitterCredentials)("should have TWITTER_CLIENT_SECRET configured", () => {
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret).not.toBe("");
    expect(clientSecret!.length).toBeGreaterThan(10);
    console.log("TWITTER_CLIENT_SECRET is configured:", clientSecret?.substring(0, 10) + "...");
  });

  it("should generate valid PKCE parameters", async () => {
    const { generatePKCE, generateState } = await import("../server/twitter-oauth2");
    
    const { codeVerifier, codeChallenge } = generatePKCE();
    const state = generateState();
    
    // Code verifier should be 43-128 characters (base64url encoded)
    expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(codeVerifier.length).toBeLessThanOrEqual(128);
    
    // Code challenge should be base64url encoded SHA256 hash
    expect(codeChallenge.length).toBeGreaterThan(0);
    
    // State should be a hex string (32 bytes = 64 hex chars, 256-bit entropy)
    expect(state.length).toBe(64); // 32 bytes = 64 hex chars
    
    console.log("PKCE parameters generated successfully");
  });

  it.skipIf(!hasTwitterCredentials)("should build valid authorization URL", async () => {
    const { generatePKCE, generateState, buildAuthorizationUrl } = await import("../server/twitter-oauth2");
    
    const { codeChallenge } = generatePKCE();
    const state = generateState();
    const callbackUrl = "https://example.com/callback";
    
    const authUrl = buildAuthorizationUrl(callbackUrl, state, codeChallenge);
    
    expect(authUrl).toContain("https://twitter.com/i/oauth2/authorize");
    expect(authUrl).toContain("response_type=code");
    expect(authUrl).toContain("client_id=");
    expect(authUrl).toContain("redirect_uri=");
    expect(authUrl).toContain("scope=");
    expect(authUrl).toContain("state=");
    expect(authUrl).toContain("code_challenge=");
    expect(authUrl).toContain("code_challenge_method=S256");
    
    console.log("Authorization URL built successfully");
  });
});
