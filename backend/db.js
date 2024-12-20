const mysql = require('mysql2/promise');

let pool;

async function createPool() {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            port: process.env.MYSQL_PORT,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 60000,
            acquireTimeout: 60000,
            timeout: 60000,
            ssl: {
                rejectUnauthorized: false
            }
        });

        try {
            const connection = await pool.getConnection();
            console.log('Database connection established successfully');
            connection.release();
        } catch (error) {
            console.error('Error establishing database connection:', error);
            throw error;
        }
    }
    return pool;
}

// Initialize pool immediately
createPool().then(() => {
    console.log('Database pool created successfully');
}).catch(err => {
    console.error('Failed to create database pool:', err);
});

async function initializeDatabase() {
    try {
        if (!pool) {
            await createPool();
        }
        
        const connection = await pool.getConnection();
        try {
            // Create users table
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS users (
                    User_Id INT AUTO_INCREMENT PRIMARY KEY,
                    First_Name VARCHAR(100) NOT NULL,
                    Last_Name VARCHAR(100) NOT NULL,
                    Email VARCHAR(100) NOT NULL UNIQUE,
                    Role VARCHAR(50) NOT NULL,
                    Password VARCHAR(20) NOT NULL
                )
            `);

            // Create clients table
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS clients (
                    Client_Id INT AUTO_INCREMENT PRIMARY KEY,
                    User_Id INT,
                    FOREIGN KEY (User_Id) REFERENCES users(User_Id)
                )
            `);

            // Create teams table (if it doesn't exist already)
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS teams (
                    Team_Id INT AUTO_INCREMENT PRIMARY KEY,
                    Team_Name VARCHAR(100) NOT NULL
                )
            `);

            // Create employees table
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS employees (
                    Employee_Id INT AUTO_INCREMENT PRIMARY KEY,
                    User_Id INT,
                    Team_Id INT,
                    FOREIGN KEY (User_Id) REFERENCES users(User_Id),
                    FOREIGN KEY (Team_Id) REFERENCES teams(Team_Id)
                )
            `);

            // Create venues table
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS venues (
                    Venue_Id INT AUTO_INCREMENT PRIMARY KEY,
                    Venue_Name VARCHAR(200) NOT NULL,
                    City VARCHAR(100) NOT NULL
                )
            `);

            // Create items table
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS items (
                    Item_Id INT AUTO_INCREMENT PRIMARY KEY,
                    Item_Name VARCHAR(100) NOT NULL
                )
            `);

            // Create vendor_items table
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS vendor_items (
                    Vendor_Id INT,
                    Item_Id INT,
                    PRIMARY KEY (Vendor_Id, Item_Id),
                    FOREIGN KEY (Vendor_Id) REFERENCES vendors(Vendor_Id),
                    FOREIGN KEY (Item_Id) REFERENCES items(Item_Id)
                )
            `);

            // Update the supplies table creation
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS supplies (
                    Event_Id INT NOT NULL,
                    Vendor_Id INT NOT NULL,
                    Item_Name VARCHAR(100) NOT NULL,
                    PRIMARY KEY (Event_Id, Vendor_Id, Item_Name),
                    FOREIGN KEY (Event_Id) REFERENCES events(Event_Id),
                    FOREIGN KEY (Vendor_Id) REFERENCES vendors(Vendor_Id)
                )
            `);

            // Create vendors table
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS vendors (
                    Vendor_Id INT AUTO_INCREMENT PRIMARY KEY,
                    Vendor_Name VARCHAR(200) NOT NULL
                )
            `);

            // Add this to your initializeDatabase function
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS participants (
                    Participant_Id INT AUTO_INCREMENT PRIMARY KEY,
                    Participant_Name VARCHAR(200) NOT NULL,
                    Event_Id INT,
                    FOREIGN KEY (Event_Id) REFERENCES events(Event_Id)
                )
            `);

            // Add this to your initializeDatabase function
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS payments (
                    Payment_Id INT AUTO_INCREMENT PRIMARY KEY,
                    Participant_Id INT,
                    Amount DECIMAL(10,2),
                    FOREIGN KEY (Participant_Id) REFERENCES participants(Participant_Id)
                )
            `);

            // Add this to your initializeDatabase function
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS event_payment (
                    Event_Id INT PRIMARY KEY,
                    Payment DECIMAL(10,2) NOT NULL,
                    FOREIGN KEY (Event_Id) REFERENCES events(Event_Id)
                )
            `);

            // Add this to your initializeDatabase function after the events and teams tables are created
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS tasks (
                    Task_Id INT AUTO_INCREMENT PRIMARY KEY,
                    Task_Name VARCHAR(200) NOT NULL,
                    Event_Id INT,
                    Team_Id INT,
                    FOREIGN KEY (Event_Id) REFERENCES events(Event_Id),
                    FOREIGN KEY (Team_Id) REFERENCES teams(Team_Id)
                )
            `);

            console.log('Database initialized successfully');
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

async function registerUser(firstName, lastName, email, role, password) {
    if (!pool) {
        await createPool();
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Insert into users table
        const [userResult] = await connection.execute(
            'INSERT INTO users (First_Name, Last_Name, Email, Role, Password) VALUES (?, ?, ?, ?, ?)',
            [firstName, lastName, email, role, password]
        );
        const userId = userResult.insertId;

        // Based on role, insert into respective table
        if (role === 'client') {
            await connection.execute(
                'INSERT INTO clients (User_Id) VALUES (?)',
                [userId]
            );
        } else if (role === 'employee') {
            // Get a random team_id from teams table
            const [teams] = await connection.execute('SELECT Team_Id FROM teams');
            if (teams.length === 0) {
                throw new Error('No teams available for employee assignment');
            }
            const randomTeam = teams[Math.floor(Math.random() * teams.length)];
            
            await connection.execute(
                'INSERT INTO employees (User_Id, Team_Id) VALUES (?, ?)',
                [userId, randomTeam.Team_Id]
            );
        }

        await connection.commit();
        return { success: true, userId };
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error('Email already exists');
        }
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    createPool,
    initializeDatabase,
    registerUser,
    pool,
    getPool: () => pool
};

