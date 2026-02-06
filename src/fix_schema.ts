import mysql from "mysql2/promise";
import "dotenv/config";

async function fixSchema() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set");
        return;
    }

    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
        console.log("Checking for 'push_token' column in 'users' table...");

        // Check if column exists
        const [rows]: any = await connection.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'push_token' AND TABLE_SCHEMA = DATABASE()"
        );

        if (rows.length === 0) {
            console.log("Column 'push_token' missing. Adding it now...");
            await connection.execute(
                "ALTER TABLE users ADD COLUMN push_token VARCHAR(255) DEFAULT NULL"
            );
            console.log("Column 'push_token' successfully added.");
        } else {
            console.log("Column 'push_token' already exists. No action needed.");
        }
    } catch (err) {
        console.error("Error updating schema:", err);
    } finally {
        await connection.end();
    }
}

fixSchema();
