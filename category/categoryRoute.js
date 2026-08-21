const express = require('express');
const router = express.Router();
const categoryController = require('./categorycontroller');

// Enforce your precise security architecture definitions
const { verifyToken, verify2FA, authorizeRoles } = require('../authentication/authmidleware');

/* 
 * 🔓 PUBLIC API ROUTING: Read-only paths for viewing lists
 */
router.get('/categories', verifyToken, verify2FA, categoryController.getAllCategories);
router.get('/categories/:category_id', verifyToken, verify2FA, categoryController.getCategoryById);

/* 
 * 🔒 SECURED MANAGEMENT API ROUTING: Only structural 'staff' and 'admin' tiers are cleared to execute updates
 */
router.post('/categories', 
    verifyToken, 
    verify2FA, 
    authorizeRoles('staff', 'admin'), 
    categoryController.addCategory
);

router.put('/categories/:category_id', 
    verifyToken, 
    verify2FA, 
    authorizeRoles('staff', 'admin'), 
    categoryController.processUpdateCategory
);

router.delete('/categories/:category_id', 
    verifyToken, 
    verify2FA, 
    authorizeRoles('staff', 'admin'), 
    categoryController.processDeleteCategory
);

module.exports = router;