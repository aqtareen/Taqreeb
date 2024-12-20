const mysql = require('mysql2/promise');
const { getPool } = require('../db');

async function getAllVenues() {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT Venue_Id, Venue_Name, City FROM Venues`);
        return rows;
    } finally {
        connection.release();
    }
}

async function getVenueById(id) {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT Venue_Id, Venue_Name, City FROM Venues WHERE Venue_Id = ?`, [id]);
        return rows[0];
    } finally {
        connection.release();
    }
}

async function createVenue(venue) {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.execute(`
            INSERT INTO Venues (Venue_Name, City)
            VALUES (?, ?)`,
            [venue.Venue_Name, venue.City]);
        return result;
    } finally {
        connection.release();
    }
}

async function deleteVenueById(id) {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.execute(`
            DELETE FROM Venues WHERE Venue_Id = ?`, [id]);
        return result;
    } finally {
        connection.release();
    }
}

module.exports = { getAllVenues, getVenueById, createVenue, deleteVenueById };

