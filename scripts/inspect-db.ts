import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";

// Load envs
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function inspect() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("No DATABASE_URL");
        process.exit(1);
    }

    console.log("Connecting to", url.replace(/:[^:@]*@/, ":***@")); // Hide password

    try {
        const connection = await mysql.createConnection(url);
        const [rows] = await connection.execute("DESCRIBE participations");
        console.log("participations columns:");
        console.log(JSON.stringify(rows, null, 2));

        await connection.end();
    } catch (e) {
        console.error(e);
    }
}

inspect();
