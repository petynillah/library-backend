const express = require('express');
const router = express.Router();
const shelfController = require('./shelfcontroller');

// Import your custom middleware gates
const { verifyToken, verify2FA, authorizeRoles } = require('../authentication/authmidleware'); 

/* 
 * 🔓 VIEWING CHANNELS: Requires a valid token and completed 2FA setup
 */
router.get('/shelves', 
    verifyToken, 
    verify2FA, 
    shelfController.getShelves
);

router.get('/shelves/:shelf_number', 
    verifyToken, 
    verify2FA, 
    shelfController.getShelfByNo
);

/* 
 * 🔒 MUTATION CHANNELS: Requires verified session, completed 2FA, and authorized 'staff' privileges
 */
router.post('/shelves', 
    verifyToken, 
    verify2FA, 
    authorizeRoles('staff', 'admin'), // 👈 Passes allowed role string arguments dynamically
    shelfController.addShelf
);

router.put('/shelves/:shelf_number', 
    verifyToken, 
    verify2FA, 
    authorizeRoles('staff', 'admin'), 
    shelfController.updateShelf
);

router.delete('/shelves/:shelf_number', 
    verifyToken, 
    verify2FA, 
    authorizeRoles('staff', 'admin'), 
    shelfController.deleteShelf
);

module.exports = router;
