const mysql = require('mysql2/promise');
const { getPool } = require('../db');

async function getAllEvents() {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT e.Event_Id, e.Event_Name, e.Event_Type, e.Date, c.Client_Id
            FROM Events e
            JOIN Clients c ON e.Client_Id = c.Client_Id`);
        return rows;
    } finally {
        connection.release();
    }
}

async function getEventById(id) {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT e.Event_Id, e.Event_Name, e.Event_Type, e.Date, c.Client_Id
            FROM Events e
            JOIN Clients c ON e.Client_Id = c.Client_Id
            WHERE e.Event_Id = ?`, [id]);
        return rows[0]; // Return specific event details
    } finally {
        connection.release();
    }
}

async function getEventByName(eventName) {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT e.Event_Id, e.Event_Name, e.Event_Type, e.Date, c.Client_Id
            FROM Events e
            JOIN Clients c ON e.Client_Id = c.Client_Id
            WHERE e.Event_Name = ?`, [eventName]);
        return rows[0]; // Return specific event details
    } finally {
        connection.release();
    }
}

async function createEvent(event) {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.execute(`
            INSERT INTO Events (Event_Name, Event_Type, Date, Client_Id)
            VALUES (?, ?, ?, ?)`, 
            [event.Event_Name, event.Event_Type, event.Date, event.Client_Id]);
        return result;
    } finally {
        connection.release();
    }
}

async function updateEventById(id, event) {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.execute(`
            UPDATE Events e
            SET e.Event_Name = ?, e.Event_Type = ?, e.Date = ?
            WHERE e.Event_Id = ?`, 
            [event.Event_Name, event.Event_Type, event.Date, id]);
        return result;
    } finally {
        connection.release();
    }
}

async function deleteEventById(id) {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.execute(`
            DELETE FROM Events WHERE Event_Id = ?`, [id]);
        return result;
    } finally {
        connection.release();
    }
}

module.exports = { getAllEvents, getEventById, getEventByName, createEvent, updateEventById, deleteEventById };