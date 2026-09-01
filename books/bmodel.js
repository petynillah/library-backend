const db = require('../authentication/database'); // Your Sequelize instance
const { QueryTypes } = require('sequelize');


    const Book = {
    create: async (data, callback) => {
        const query = `INSERT INTO books (book_title, isbn_number, author, category, reading_level, sub_category) VALUES (?, ?, ?, ?, ?, ?)`;
        try {
            const [result] = await db.query(query, {
                replacements: [data.book_title, data.isbn_number, data.author, data.category, data.reading_level, data.sub_category],
                type: QueryTypes.INSERT
            });
            callback(null, result);
        } catch (err) {
            callback(err, null);
        }
    },

    // ADD THIS BACK IN — was overwritten when findAvailable was added
    findAll: async (search, callback) => {
        let query = `SELECT * FROM books`;
        let replacements = [];
        if (search) {
            query += ` WHERE book_title LIKE ? OR isbn_number LIKE ? OR author LIKE ?`;
            replacements = [`%${search}%`, `%${search}%`, `%${search}%`];
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

    findAvailable: async (search, callback) => {
        let query = `
            SELECT b.* FROM books b
            WHERE NOT EXISTS (
                SELECT 1 FROM borrowings br 
                WHERE br.isbn_number = b.isbn_number AND br.status = 'active'
            )`;
        let replacements = [];

        if (search) {
            query += ` AND (b.book_title LIKE ? OR b.isbn_number LIKE ? OR b.author LIKE ?)`;
            replacements = [`%${search}%`, `%${search}%`, `%${search}%`];
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
   
   
  findByIsbn: async (isbn, callback) => {
  try {
    const results = await db.query(
      `SELECT * FROM books WHERE isbn_number = :isbn`, 
      { 
        replacements: { isbn: isbn }, // Explicit mapping
        type: QueryTypes.SELECT 
      }
    );
    callback(null, results);
  } catch (err) {
    callback(err, null);
  }
},

    update: async (isbn, data, callback) => {
        const query = `UPDATE books SET book_title = ?, author = ?, category = ?, reading_level = ?, sub_category = ? WHERE isbn_number = ?`;
        try {
            const [result] = await db.query(query, {
                replacements: [data.book_title, data.author, data.category, data.reading_level, data.sub_category, isbn],
                type: QueryTypes.UPDATE
            });
            callback(null, result);
        } catch (err) {
            callback(err, null);
        }
    },

    delete: async (isbn, callback) => {
        try {
            const result = await db.query(`DELETE FROM books WHERE isbn_number = ?`, {
                replacements: [isbn],
                type: QueryTypes.DELETE
            });
            callback(null, result);
        } catch (err) {
            callback(err, null);
        }
    },

    borrow: async (data, callback) => {
        const query = `INSERT INTO borrowings (student_id, student_name, isbn_number, borrow_date) VALUES (?, ?, ?, ?)`;
        try {
            const [result] = await db.query(query, {
                replacements: [data.student_id, data.student_name, data.isbn_number, data.borrow_date],
                type: QueryTypes.INSERT
            });
            callback(null, result);
        } catch (err) {
            callback(err, null);
        }
    },

    // Verifies if a student exists in the system before issuing a book
    verifyStudentExists: async (studentId, callback) => {
        // Replace 'users' with the actual name of your student table if it is different
        const query = `SELECT COUNT(*) as count FROM students WHERE student_id = ?`;
        try {
            const results = await db.query(query, {
                replacements: [studentId],
                type: QueryTypes.SELECT
            });
            // Returns true if the student is found, otherwise false
            callback(null, results[0].count > 0);
        } catch (err) {
            callback(err, null);
        }
    },

        // Checks if a specific book is currently out on loan
    checkActiveLoan: async (isbnNumber, callback) => {
        const query = `SELECT COUNT(*) as count FROM borrowings WHERE isbn_number = ? AND status = 'active'`;
        try {
            const results = await db.query(query, {
                replacements: [isbnNumber],
                type: QueryTypes.SELECT
            });
            // Send back true if count > 0, otherwise false
            callback(null, results[0].count > 0);
        } catch (err) {
            callback(err, null);
        }
    },
    // Counts how many active book loans a specific student currently holds
    countActiveLoansByStudent: async (studentId, callback) => {
        const query = `SELECT COUNT(*) as active_count FROM borrowings WHERE student_id = ? AND status = 'active'`;
        try {
            const results = await db.query(query, {
                replacements: [studentId],
                type: QueryTypes.SELECT
            });
            
            // Raw SELECT queries return an array, grab the count property safely
            const count = results[0]?.active_count || 0;
            callback(null, count);
        } catch (err) {
            callback(err, null);
        }
    },

    // View all borrowed books (Matches Borrowedb component)
     findAllBorrowed: async (callback) => {
    const query = `
        SELECT 
            COALESCE(b.book_title, br.book_title, 'Unknown Book') AS book_title, 
            COALESCE(b.author, 'N/A') AS author, 
            br.isbn_number, 
            COALESCE(b.category, 'Uncategorized') AS category, 
            COALESCE(b.sub_category, '') AS sub_category, 
            br.borrow_date,
            br.return_date,
            br.student_name,
            br.student_id
        FROM borrowings br
        LEFT JOIN books b ON br.isbn_number = b.isbn_number
        ORDER BY br.borrow_date DESC`;
    try {
        const results = await db.query(query, { type: QueryTypes.SELECT });
        callback(null, results);
    } catch (err) {
        callback(err, null);
    }
},


    // Find active borrowing history by Student ID (Matches Returnborr dashboard search)
    findActiveBorrowingByStudent: async (studentId, callback) => {
    const searchString = String(studentId).trim();

    const query = `
        SELECT 
            br.student_id, 
            br.student_name, 
            COALESCE(b.book_title, 'Unknown Book') AS book_title, 
            br.isbn_number, 
            COALESCE(b.author, 'N/A') AS author,
            COALESCE(b.category, 'Uncategorized') AS category,
            COALESCE(b.sub_category, '') AS sub_category,
            br.borrow_date 
        FROM borrowings br
        JOIN books b ON br.isbn_number = b.isbn_number
        WHERE br.student_id = ? AND br.status = 'active'`;
    try {
        const results = await db.query(query, {
            replacements: [searchString],
            type: QueryTypes.SELECT
        });
        callback(null, results);
    } catch (err) {
        callback(err, null);
    }
},

    // Verifies if a book exists in the system catalog before issuing it
    verifyBookExists: async (isbnNumber, callback) => {
        const query = `SELECT COUNT(*) as count FROM books WHERE isbn_number = ?`;
        try {
            const results = await db.query(query, {
                replacements: [isbnNumber],
                type: QueryTypes.SELECT
            });
            
            // Raw SELECT queries return an array; check the count field
            const count = results[0]?.count || 0;
            callback(null, count > 0);
        } catch (err) {
            callback(err, null);
        }
    },


    // Mark a book as returned by updating the return_date (Matches Return action)
   // Mark a book as returned, update return_date, and flip status to inactive
returnBook: async (studentId, isbnNumber, returnDate, callback) => {
    const query = `
        UPDATE borrowings 
        SET return_date = ?, status = 'inactive' 
        WHERE student_id = ? AND isbn_number = ? AND status = 'active'`; // 👈 Safely target the active loan
    try {
        const [result, metadata] = await db.query(query, {
            replacements: [returnDate, studentId, isbnNumber],
            type: QueryTypes.UPDATE
        });
        
        // Raw updates in Sequelize return metadata. We pass it back to inspect affected rows.
        callback(null, result || metadata);
    } catch (err) {
        callback(err, null);
    }
}

};

    


module.exports = Book;
