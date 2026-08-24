const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const masterDbPath = path.join(dataDir, 'master.db');

let dbPromise;

async function setupDatabase() {
    const db = await open({
        filename: masterDbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS superadmin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        );

        CREATE TABLE IF NOT EXISTS tenants (
            id TEXT PRIMARY KEY,
            name TEXT,
            domain TEXT UNIQUE,
            status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS registration_requests (
            id TEXT PRIMARY KEY,
            org_name TEXT,
            org_type TEXT,
            region TEXT,
            city TEXT,
            description TEXT,
            expected_groups INTEGER,
            expected_students INTEGER,
            expected_teachers INTEGER,
            manager_name TEXT,
            phone TEXT,
            email TEXT,
            username TEXT,
            password TEXT,
            site_name TEXT,
            logo_url TEXT,
            color_primary TEXT,
            color_secondary TEXT,
            domain TEXT,
            status TEXT DEFAULT 'new',
            admin_notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Insert default superadmin if not exists
    const result = await db.get('SELECT count(*) as count FROM superadmin');
    if (result.count === 0) {
        await db.run('INSERT INTO superadmin (username, password) VALUES (?, ?)', ['superadmin', '123']);
    }

    return db;
}

dbPromise = setupDatabase();

module.exports = dbPromise;
