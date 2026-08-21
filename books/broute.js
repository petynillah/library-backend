const express = require('express');
const router = express.Router();
const bookController = require('./bcontroller');
const { verifyToken, verify2FA, authorizeRoles } = require('../authentication/authmidleware');

// Applies to every route below — no need to repeat verifyToken per-route
router.use(verifyToken);
router.use(verify2FA);

// ==========================================
// CATALOG ROUTES
// ==========================================
router.get('/book/all', authorizeRoles('admin', 'staff', 'student'), bookController.getBooks);
router.get('/book/details/:isbn', authorizeRoles('admin', 'staff', 'student'), bookController.getBookDetailsByIsbn);

// ==========================================
// STAFF/ADMIN-ONLY MANAGEMENT ROUTES
// ==========================================
router.post('/book/add', authorizeRoles('admin', 'staff'), bookController.addBook);
router.put('/book/update/:isbn', authorizeRoles('admin', 'staff'), bookController.updateBook);
router.delete('/book/delete/:isbn', authorizeRoles('admin', 'staff'), bookController.deleteBook);
router.get('/book/available', authorizeRoles('admin', 'staff', 'student'), bookController.getAvailableBooks);
// ==========================================
// BORROWING & DASHBOARD ROUTES
// ==========================================
router.post('/book/borrow', authorizeRoles('staff', 'admin'), bookController.borrowBook);
router.get('/book/borrowed', bookController.getAllBorrowedBooks);
router.get('/book/borrowed/:student_id', bookController.searchActiveBorrowing);
router.post('/book/borrowed/return', authorizeRoles('staff', 'admin'), bookController.processReturnBook);

module.exports = router;