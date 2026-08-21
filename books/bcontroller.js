const Book = require('./bmodel');

// ==========================================
// 1. CREATE
// ==========================================
exports.addBook = (req, res) => {
    Book.create(req.body, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Book added successfully!" });
    });
};

// ==========================================
// 2. READ (catalog + search)
// ==========================================
exports.getBooks = (req, res) => {
    const search = req.query.search || '';
    Book.findAll(search, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
};

exports.getAvailableBooks = (req, res) => {
    const search = req.query.search || '';
    Book.findAvailable(search, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
};
exports.getBookDetailsByIsbn = (req, res) => {
    const isbn = req.params.isbn;

    if (!isbn) {
        return res.status(400).json({ error: "ISBN parameter is required." });
    }

    Book.findByIsbn(isbn, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!results || results.length === 0) {
            return res.status(404).json({ error: `No book found with ISBN: ${isbn}` });
        }

        res.status(200).json(results);
    });
};

// ==========================================
// 3. UPDATE
// ==========================================
exports.updateBook = (req, res) => {
    Book.update(req.params.isbn, req.body, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Book updated successfully!" });
    });
};

// ==========================================
// 4. DELETE
// ==========================================
exports.deleteBook = (req, res) => {
    Book.delete(req.params.isbn, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Book deleted successfully!" });
    });
};

// ==========================================
// 5. BORROW (with full validation chain)
// ==========================================
exports.borrowBook = (req, res) => {
    const { student_id, isbn_number, borrow_date } = req.body;

    if (!student_id || !isbn_number) {
        return res.status(400).json({ error: "Student ID and ISBN number are required fields." });
    }

    // Date Standardizer (Ensures clean YYYY-MM-DD format for MySQL)
    let safeBorrowDate = borrow_date;
    if (borrow_date && borrow_date.includes('/')) {
        const [month, day, year] = borrow_date.split('/');
        safeBorrowDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else if (!borrow_date) {
        safeBorrowDate = new Date().toISOString().slice(0, 10);
    }

    // STEP 1: Verify the student actually exists
    Book.verifyStudentExists(student_id, (err, studentExists) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!studentExists) {
            return res.status(404).json({
                error: `Access Denied. Student ID "${student_id}" does not exist.`,
                code: "STUDENT_NOT_FOUND"
            });
        }

        // STEP 2: Verify the book actually exists in the catalog
        Book.verifyBookExists(isbn_number, (err, bookExists) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!bookExists) {
                return res.status(404).json({
                    error: `Transaction Denied. ISBN "${isbn_number}" is not registered in the system inventory.`,
                    code: "BOOK_NOT_FOUND"
                });
            }

            // STEP 3: Ensure the book isn't already checked out
            Book.checkActiveLoan(isbn_number, (err, isBorrowed) => {
                if (err) return res.status(500).json({ error: err.message });
                if (isBorrowed) {
                    return res.status(400).json({ 
                        error: "This book is currently borrowed and has not been returned yet.",
                        code: "BOOK_ALREADY_LOANED" 
                    });
                }

                // STEP 4: Check student checkout limitations (Maximum 3 books)
                Book.countActiveLoansByStudent(student_id, (err, activeCount) => {
                    if (err) return res.status(500).json({ error: err.message });

                    const MAX_ALLOWED_BOOKS = 3;
                    if (activeCount >= MAX_ALLOWED_BOOKS) {
                        return res.status(400).json({
                            error: `Student has reached the maximum quota of ${MAX_ALLOWED_BOOKS} borrowed books.`,
                            code: "STUDENT_QUOTA_EXCEEDED"
                        });
                    }

                    const finalizedData = {
                        ...req.body,
                        borrow_date: safeBorrowDate
                    };

                    // STEP 5: All validations pass -> Save to database
                    Book.borrow(finalizedData, (err, result) => {
                        if (err) return res.status(500).json({ error: err.message });
                        res.status(201).json({ message: "Book issued successfully!" });
                    });
                });
            });
        });
    });
};

// ==========================================
// 6. BORROW HISTORY / RETURN
// ==========================================
exports.getAllBorrowedBooks = (req, res) => {
    Book.findAllBorrowed((err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
};

exports.searchActiveBorrowing = (req, res) => {
    const studentId = req.params.student_id;

    Book.findActiveBorrowingByStudent(studentId, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!results || results.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(results);
    });
};


exports.processReturnBook = (req, res) => {
    const { student_id, isbn_number, return_date } = req.body;

    let missingFields = [];
    if (!student_id) missingFields.push("student_id");
    if (!isbn_number) missingFields.push("isbn_number");
    if (!return_date) missingFields.push("return_date");

    if (missingFields.length > 0) {
        return res.status(400).json({ 
            error: "Missing required return parameters.",
            message: `The request is missing the following fields: ${missingFields.join(', ')}`
        });
    }

    Book.returnBook(student_id, isbn_number, return_date, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result && result.affectedRows === 0) {
            return res.status(404).json({ 
                error: "No active loan record found.",
                message: "This book has either already been returned or the borrowing record does not exist." 
            });
        }

        res.status(200).json({ message: "Book returned successfully! Status updated to inactive." });
    });
};

// ⚠️ WARNING: DO NOT ADD `module.exports = ...` down here!
// Using `exports.methodName` at the top of each function handles exports safely.