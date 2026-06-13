import { SignJWT } from "jose";
import { Page } from "@playwright/test";

const COOKIE_NAME = "app_session_id";
// server/_core/env.ts defaults to empty string if JWT_SECRET is not set
const JWT_SECRET = process.env.JWT_SECRET || "";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 72; // 72時間

export async function loginAsUser(page: Page, user: { openId: string; appId: string; name: string }) {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const issuedAt = Date.now();
    const expirationSeconds = Math.floor((issuedAt + SESSION_MAX_AGE_MS) / 1000);

    console.log("Generating JWT for user:", user.openId);
    try {
        const jwt = await new SignJWT({
            openId: user.openId,
            appId: user.appId,
            name: user.name,
        })
            .setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setExpirationTime(expirationSeconds)
            .sign(secretKey);

        console.log("JWT generated successfully. Setting cookie...");
        await page.context().addCookies([
            {
                name: COOKIE_NAME,
                value: jwt,
                url: "http://localhost:8081", // Use url instead of domain for better compatibility
                path: "/",
                httpOnly: true,
                secure: false,
                sameSite: "Lax",
            },
        ]);
        console.log("Cookie set successfully.");
    } catch (error) {
        console.error("Error in loginAsUser:", error);
        throw error;
    }
}
