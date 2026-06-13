import crypto from "crypto";
import { Request, Response } from "express";

// Twitter OAuth 1.0a implementation
const TWITTER_API_KEY = process.env.TWITTER_API_KEY || "";
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET || "";

// OAuth 1.0a signature generation
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  tokenSecret: string = ""
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&");

  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join("&");

  const signingKey = `${encodeURIComponent(TWITTER_API_SECRET)}&${encodeURIComponent(tokenSecret)}`;

  return crypto
    .createHmac("sha1", signingKey)
    .update(signatureBaseString)
    .digest("base64");
}

// Generate OAuth header
function generateOAuthHeader(
  method: string,
  url: string,
  oauthParams: Record<string, string>,
  tokenSecret: string = ""
): string {
  const signature = generateOAuthSignature(method, url, oauthParams, tokenSecret);
  const headerParams: Record<string, string> = { ...oauthParams, oauth_signature: signature };

  const headerString = Object.keys(headerParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}="${encodeURIComponent(headerParams[key])}"`)
    .join(", ");

  return `OAuth ${headerString}`;
}

// Step 1: Get request token
export async function getRequestToken(callbackUrl: string): Promise<{
  oauth_token: string;
  oauth_token_secret: string;
}> {
  const url = "https://api.twitter.com/oauth/request_token";
  const oauthParams: Record<string, string> = {
    oauth_callback: callbackUrl,
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
  };

  const authHeader = generateOAuthHeader("POST", url, oauthParams);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get request token: ${text}`);
  }

  const text = await response.text();
  const params = new URLSearchParams(text);

  return {
    oauth_token: params.get("oauth_token") || "",
    oauth_token_secret: params.get("oauth_token_secret") || "",
  };
}

// Step 2: Exchange for access token
export async function getAccessToken(
  oauthToken: string,
  oauthTokenSecret: string,
  oauthVerifier: string
): Promise<{
  oauth_token: string;
  oauth_token_secret: string;
  user_id: string;
  screen_name: string;
}> {
  const url = "https://api.twitter.com/oauth/access_token";
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: oauthToken,
    oauth_verifier: oauthVerifier,
    oauth_version: "1.0",
  };

  const authHeader = generateOAuthHeader("POST", url, oauthParams, oauthTokenSecret);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get access token: ${text}`);
  }

  const text = await response.text();
  const params = new URLSearchParams(text);

  return {
    oauth_token: params.get("oauth_token") || "",
    oauth_token_secret: params.get("oauth_token_secret") || "",
    user_id: params.get("user_id") || "",
    screen_name: params.get("screen_name") || "",
  };
}

// Get user profile from Twitter API v2
export async function getUserProfile(
  accessToken: string,
  accessTokenSecret: string
): Promise<{
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
  description: string;
}> {
  const url = "https://api.twitter.com/2/users/me";
  const params = "user.fields=profile_image_url,public_metrics,description";
  const fullUrl = `${url}?${params}`;

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  // For GET requests with query params, include them in signature
  const signatureParams = {
    ...oauthParams,
    "user.fields": "profile_image_url,public_metrics,description",
  };

  const signature = generateOAuthSignature("GET", url, signatureParams, accessTokenSecret);
  const headerParams: Record<string, string> = { ...oauthParams, oauth_signature: signature };

  const headerString = Object.keys(headerParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}="${encodeURIComponent(headerParams[key])}"`)
    .join(", ");

  const response = await fetch(fullUrl, {
    method: "GET",
    headers: {
      Authorization: `OAuth ${headerString}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get user profile: ${text}`);
  }

  const json = await response.json();
  return json.data;
}

// Store for temporary oauth tokens (in production, use Redis or database)
const oauthTokenStore = new Map<string, string>();

export function storeOAuthTokenSecret(token: string, secret: string): void {
  oauthTokenStore.set(token, secret);
  // Clean up after 10 minutes
  setTimeout(() => oauthTokenStore.delete(token), 10 * 60 * 1000);
}

export function getOAuthTokenSecret(token: string): string | undefined {
  return oauthTokenStore.get(token);
}

export function deleteOAuthTokenSecret(token: string): void {
  oauthTokenStore.delete(token);
}
