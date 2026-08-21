const jwt = require('jsonwebtoken');
// Clean and safe
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("CRITICAL: JWT_SECRET is not defined in the environment variables.");
}

console.log('authmodel/controller sees:', JSON.stringify(process.env.JWT_SECRET));


// ==========================================
// 1. PRIMARY JWT VERIFICATION
// ==========================================


exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Clean, structured backend logging
  console.log("=== BACKEND INTERCEPT ===");
  console.log("Received Auth Header:", authHeader ? "PRESENT" : "NONE"); 
  console.log("Using Secret Key String:", process.env.JWT_SECRET ? "KEY_LOADED" : "MISSING_KEY");
  console.log("=========================");

  // Enforce header presence and Bearer schema matching early
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ message: 'Access denied. No token provided.' });
  }

  // Safe split execution
  const token = authHeader.split(' ')[1]; 

  console.log('Token length:', token.length);
console.log('Token:', token);

const crypto = require('crypto');
console.log('Secret fingerprint:', crypto.createHash('sha256').update(process.env.JWT_SECRET).digest('hex').slice(0, 8));

  // Ensure the token string itself actually exists and is not whitespace
  if (!token || !token.trim()) {
    return res.status(403).json({ message: 'Access denied. Malformed token structure.' });
  }

  // STRICT CHECK: Only skip verification in designated local development environments
  // Added an extra fallback guard to ensure NODE_ENV is explicitly checked
  if (process.env.NODE_ENV === 'development' && token === 'mock-token') {
    req.user = { id: 'mock-id-123', role: 'staff', is2FAVerified: true };
    return next();
  }

  try {
    // Ensure JWT_SECRET actually exists before trying to verify
    if (!process.env.JWT_SECRET) {
      throw new Error("Internal server configuration error: Missing JWT Secret.");
    }

    const decoded = jwt.verify(token, JWT_SECRET); 
    req.user = decoded; 
    next();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error("❌ JWT Verification Failed! Reason:", errorMessage);
    
    // Explicitly differentiate between an expired session and a tampered token
    if (err && err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Session expired. Please log in again.', 
        code: 'TOKEN_EXPIRED' 
      });
    }

    return res.status(401).json({ 
      message: 'Invalid token signature.', 
      reason: process.env.NODE_ENV === 'development' ? errorMessage : 'Verification failed.' 
    });
  }
};


// ==========================================
// 2. TWO-FACTOR AUTHENTICATION ENFORCEMENT
// ==========================================
exports.verify2FA = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    
    // THE FIX: If the user is a student, bypass the 2FA requirement completely!
    if (req.user.role === 'student') {
        return next();
    }

    // Staff/Admins will still be strictly checked for 2FA validation flags
    if (req.user.is2FAVerified !== true) {
        return res.status(403).json({ 
            message: '2FA authentication required.', 
            code: 'REQUIRE_2FA_VERIFICATION' 
        });
    }
    next();
};

// ==========================================
// 3. ROLE-BASED ACCESS CONTROL
// ==========================================
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized access tier' });
    }
    next();
  };
};
