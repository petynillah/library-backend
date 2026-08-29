const db = require('../authentication/database'); 
const { QueryTypes } = require('sequelize');

const Shelf = {
    create: async (data, callback) => {
        const query = `INSERT INTO shelves (shelf_number, shelf_category, book_category, status) VALUES (?, ?, ?, ?)`;
        try {
            const status = data.status || 'available';
            const [result] = await db.query(query, {
                replacements: [data.shelf_number, data.shelf_category, data.book_category, status],
                type: QueryTypes.INSERT
            });
            callback(null, result);
        } catch (err) {
            callback(err, null);
        }
    },

    findAll: async (search, callback) => {
        let query = `SELECT * FROM shelves`;
        let replacements = [];
        if (search) {
            query += ` WHERE shelf_number LIKE ? OR shelf_category LIKE ? OR book_category LIKE ?`;
            replacements = [search.trim().toUpperCase(), `%${search}%`, `%${search}%`];
        }
        try {
            const results = await db.query(query, {
                replacements: replacements,
                type: QueryTypes.SELECT
            });
            callback(null, results);
        } catch (err) {
            callback(err, null);
        }
    },

    findByNumber: async (shelfNumber, callback) => {
        try {
            const results = await db.query(`SELECT * FROM shelves WHERE shelf_number = ?`, {
                replacements: [shelfNumber],
                type: QueryTypes.SELECT
            });
            
            if (!results || results.length === 0) {
                return callback(null, null);
            }
            callback(null, results[0]);
        } catch (err) {
            callback(err, null);
        }
    },

    // UPDATED: shelf_number is now part of the SET clause so a shelf can be renamed.
    // currentShelfNumber is the lookup key (the URL param / pre-rename identifier);
    // data.shelf_number is the (possibly new) value to write.
    update: async (currentShelfNumber, data, callback) => {
        const query = `UPDATE shelves SET shelf_number = ?, shelf_category = ?, book_category = ?, status = ? WHERE shelf_number = ?`;
        try {
            const status = data.status || 'available';
            const [result] = await db.query(query, {
                replacements: [data.shelf_number, data.shelf_category, data.book_category, status, currentShelfNumber],
                type: QueryTypes.UPDATE
            });
            callback(null, result);
        } catch (err) {
            callback(err, null);
        }
    },

    delete: async (shelfNumber, callback) => {
        try {
            const result = await db.query(`DELETE FROM shelves WHERE shelf_number = ?`, {
                replacements: [shelfNumber],
                type: QueryTypes.DELETE
            });
            callback(null, result);
        } catch (err) {
            callback(err, null);
        }
    }
};

module.exports = Shelf;