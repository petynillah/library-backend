const db = require('../authentication/database'); // Adjust your path to database.js
const { QueryTypes } = require('sequelize');

const Category = {
  create: async (data, callback) => {
    const query = `INSERT INTO categories (category_name, reading_level, category_subject) VALUES (?, ?, ?)`;
    try {
      const [result] = await db.query(query, { 
        replacements: [data.category_name, data.reading_level, data.category_subject], 
        type: QueryTypes.INSERT 
      });
      callback(null, result);
    } catch (err) {
      callback(err, null);
    }
  },

  // Extract all rows from categories with wildcard search functionality
  findAll: async (search, callback) => {
    let query = `SELECT * FROM categories`;
    let replacements = [];
    if (search) {
      query += ` WHERE category_name LIKE ? OR category_subject LIKE ?`;
      replacements = [`%${search}%`, `%${search}%`];
    }
    try {
      const results = await db.query(query, { replacements: replacements, type: QueryTypes.SELECT });
      callback(null, results);
    } catch (err) {
      callback(err, null);
    }
  },

  // NEW: category_id is the true unique identifier (category_name/category_subject can repeat)
  findById: async (categoryId, callback) => {
    try {
      const results = await db.query(`SELECT * FROM categories WHERE category_id = ?`, { 
        replacements: [categoryId], 
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

  // NEW: used by shelves to verify a book_category value actually refers to a real category
  findBySubject: async (subject, callback) => {
    try {
      const results = await db.query(`SELECT * FROM categories WHERE category_subject = ?`, {
        replacements: [subject],
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

  // Checks if the exact configuration layout already exists across all 3 columns (used on create to block dupes)
  findOne: async (criteria, callback) => {
    const query = `SELECT * FROM categories WHERE category_name = ? AND reading_level = ? AND category_subject = ?`;
    try {
      const results = await db.query(query, {
        replacements: [criteria.category_name, criteria.reading_level, criteria.category_subject],
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

  // UPDATED: keyed by category_id, and category_name is now updatable alongside the other fields
  update: async (categoryId, data, callback) => {
    const query = `UPDATE categories SET category_name = ?, reading_level = ?, category_subject = ? WHERE category_id = ?`;
    try {
      const [result] = await db.query(query, { 
        replacements: [data.category_name, data.reading_level, data.category_subject, categoryId], 
        type: QueryTypes.UPDATE 
      });
      callback(null, result);
    } catch (err) {
      callback(err, null);
    }
  },

  // UPDATED: keyed by category_id
  delete: async (categoryId, callback) => {
    try {
      const result = await db.query(`DELETE FROM categories WHERE category_id = ?`, { 
        replacements: [categoryId], 
        type: QueryTypes.DELETE 
      });
      callback(null, result);
    } catch (err) {
      callback(err, null);
    }
  }
};

module.exports = Category;