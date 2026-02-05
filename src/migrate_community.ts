import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function run() {
    const connection = await mysql.createConnection(DATABASE_URL!);
    console.log("Connected to database...");

    const queries = [
        "CREATE TABLE IF NOT EXISTS community_rooms (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, description TEXT, type VARCHAR(20) DEFAULT 'public', icon VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS community_messages (id INT AUTO_INCREMENT PRIMARY KEY, room_id INT NOT NULL, user_id VARCHAR(36) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS community_posts (id INT AUTO_INCREMENT PRIMARY KEY, user_id VARCHAR(36) NOT NULL, content TEXT NOT NULL, image_url VARCHAR(500), likes_count INT DEFAULT 0, comments_count INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS community_comments (id INT AUTO_INCREMENT PRIMARY KEY, post_id INT NOT NULL, user_id VARCHAR(36) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS community_likes (id INT AUTO_INCREMENT PRIMARY KEY, post_id INT NOT NULL, user_id VARCHAR(36) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
    ];

    for (const q of queries) {
        console.log(`Executing: ${q.substring(0, 50)}...`);
        await connection.execute(q);
    }

    console.log("Seeding default rooms...");
    const rooms = [
        ["Direct Sparks", "Fast, high-energy connections and icebreakers.", "public", "Zap"],
        ["Heart to Heart", "Deep conversations about values, life, and love.", "public", "Heart"],
        ["The Intimacy Lab", "A safe space for exploring boundaries and health.", "public", "Shield"],
        ["Erotic Insights", "Polished discussions on pleasure and styling.", "public", "Sparkles"]
    ];

    for (const [name, desc, type, icon] of rooms) {
        const [existing] = await connection.execute("SELECT id FROM community_rooms WHERE name = ?", [name]);
        if ((existing as any[]).length === 0) {
            await connection.execute("INSERT INTO community_rooms (name, description, type, icon) VALUES (?, ?, ?, ?)", [name, desc, type, icon]);
        }
    }

    console.log("Migration and seeding complete.");
    await connection.end();
}

run().catch(console.error);
