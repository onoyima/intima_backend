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

        console.log("Checking session table column types...");
        // Check if sess column is JSON or TEXT
        const [sessionCols]: any = await connection.execute(
            "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'sessions' AND TABLE_SCHEMA = DATABASE()"
        );

        const sessCol = sessionCols.find((c: any) => c.COLUMN_NAME === 'sess');
        if (sessCol && sessCol.DATA_TYPE === 'json') {
            console.log("Changing 'sess' column in 'sessions' to TEXT for better compatibility...");
            await connection.execute("ALTER TABLE sessions MODIFY COLUMN sess TEXT NOT NULL");
        }

        const expireCol = sessionCols.find((c: any) => c.COLUMN_NAME === 'expire');
        if (expireCol && expireCol.DATA_TYPE !== 'int' && expireCol.DATA_TYPE !== 'int unsigned') {
            console.log("Changing 'expire' column in 'sessions' to INT...");
            await connection.execute("ALTER TABLE sessions MODIFY COLUMN expire INT NOT NULL");
        }

        console.log("Schema check complete.");
    } catch (err) {
        console.error("Error updating schema:", err);
    } finally {
        await connection.end();
    }
}

fixSchema();
