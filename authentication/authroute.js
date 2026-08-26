const express = require('express');
const router = express.Router();

// Import separate controllers
const { 
  registerStudent, 
  loginStudent, 
  getAllStudents, 
  getStudentById, 
  updateStudent, 
  deleteStudent 
} = require('./authcontroller');

const { 
  registerStaff, 
  loginStaff, 
  verifyOTP: verifyStaff2FA, // 👈 Change this line to map verifyOTP to verifyStaff2FA
  revokeAllTrustedDevices, 
  revokeCurrentDevice, 
  getAllStaff, 
  getStaffById, 
  updateStaff, 
  deleteStaff 
} = require('./staffauthcontroller');


// Import your verified middleware
const { verifyToken, verify2FA, authorizeRoles } = require('./authmidleware');


router.post('/auth/generate-sso-ticket', verifyToken, staffauthcontroller.generateSSOTicket);
router.post('/auth/exchange-sso-ticket', staffauthcontroller.exchangeSSOTicket);

// ==========================================
// 1. PUBLIC ROUTES (No Token Needed)
// ==========================================
router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);


router.post('/staff/register', registerStaff); // Allowed public or handle admin restriction downstream
router.post('/staff/login', loginStaff);
router.post('/staff/verify-2fa', verifyToken, verifyStaff2FA);
router.post('/staff/revoke-all-devices', verifyToken, revokeAllTrustedDevices); // ADD THIS
router.post('/staff/revoke-current-device', verifyToken, revokeCurrentDevice);  

// ==========================================
// 2. PROTECTED STUDENT ROUTES
// ==========================================
// All these routes require a valid token and pass through the 2FA bypass engine
router.get(
  '/student/all', 
  verifyToken, 
  verify2FA, 
  authorizeRoles('staff', 'admin'), 
  getAllStudents
); 

router.get(
  '/student/:id', 
  verifyToken, 
  verify2FA, 
  authorizeRoles('staff', 'student', 'admin'), 
  getStudentById
);

router.put(
  '/student/:id', 
  verifyToken, 
  verify2FA, 
  authorizeRoles('staff', 'student', 'admin'), 
  updateStudent
);

router.delete(
  '/student/:id', 
  verifyToken, 
  verify2FA, 
  authorizeRoles('staff', 'admin'), 
  deleteStudent
);

// ==========================================
// 3. PROTECTED STAFF ROUTES
// ==========================================
router.get(
  '/staff/all', 
  verifyToken, 
  verify2FA, 
  authorizeRoles('staff', 'admin'), 
  getAllStaff
);

router.get(
  '/staff/:id', 
  verifyToken, 
  verify2FA, 
  authorizeRoles('staff', 'admin'), 
  getStaffById
);

router.put(
  '/staff/:id', // FIX: Added URL parameter variable
  verifyToken, 
  verify2FA, 
  authorizeRoles('staff', 'admin'), 
  updateStaff
);

router.delete(
  '/staff/:id', // FIX: Changed method to .delete and added URL parameter variable
  verifyToken, 
  verify2FA, 
  authorizeRoles('admin'), 
  deleteStaff
);

// Staff Only Resource
router.get(
  '/staff-resource/attendance', 
  verifyToken, 
  verify2FA, 
  authorizeRoles('staff', 'admin'), 
  (req, res) => {
    res.status(200).json({ success: true, message: 'Staff roster retrieved successfully.' });
  }
);

module.exports = router;
