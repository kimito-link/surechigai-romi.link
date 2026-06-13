import { SignJWT } from "jose";

async function run() {
    console.log("Generating JWT...");
    const secretKey = new TextEncoder().encode("secret");
    const jwt = await new SignJWT({ sub: "test" })
        .setProtectedHeader({ alg: "HS256" })
        .sign(secretKey);
    console.log("JWT:", jwt);
}

run().catch(console.error);
