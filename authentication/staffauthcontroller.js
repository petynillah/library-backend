const StaffUser = require('./staffauthmodel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;


if (!JWT_SECRET) {
  throw new Error("CRITICAL: JWT_SECRET is not defined in the environment variables.");
}

// ==========================================
// TEMPORARY TRUSTED-DEVICE STORE (in-memory)
// TODO: move to a DB table (device_token, staff_id, expires_at) before
// production / multi-instance deployment — this Map resets on restart.
// ==========================================
const trustedDevices = new Map(); // key: deviceToken -> { staffId, expiresAt }

function issueTrustedDeviceToken(staffId, res) {
  const deviceToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

  trustedDevices.set(deviceToken, { staffId, expiresAt });

  res.cookie('trustedDevice', deviceToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000
});

function isDeviceTrusted(req, staffId) {
  const deviceToken = req.cookies?.trustedDevice;
  if (!deviceToken) return false;

  const record = trustedDevices.get(deviceToken);
  if (!record) return false;

  if (Date.now() > record.expiresAt) {
    trustedDevices.delete(deviceToken);
    return false;
  }

  return record.staffId === staffId;
}
// ==========================================
// TEMPORARY OTP STORE (in-memory)
// TODO: Replace with a DB table or Redis before production / multi-instance
// deployment — this Map is wiped on every server restart and won't work
// across multiple server processes.
// ==========================================
const otpStore = new Map(); // key: staff.id -> { otp, expiresAt }

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString(); // 6-digit code
}// ==========================================
// 1. CREATE (Staff Registration)
// ==========================================
exports.registerStaff = async (req, res) => {
  try {
    const { name, age, id_number, occupation, gender, password } = req.body;

    // Dynamic validation check
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!age) missingFields.push('age');
    if (!id_number) missingFields.push('id_number');
    if (!occupation) missingFields.push('occupation');
    if (!gender) missingFields.push('gender');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`, 
        missingFields: missingFields 
      });
    }

    // Hash the password safely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the base record inside MySQL
    const newStaff = await StaffUser.create({
      name,
      gender,
      age: parseInt(age),
      id_number: parseInt(id_number),
      occupation,
      password: hashedPassword,
      role: 'staff'
    });

    // GENERATE THE UNIQUE ID: Combines 'STF', current year, and the database primary key
    const currentYear = new Date().getFullYear();
    const generatedId = `STF-${currentYear}-${newStaff.id}`;

    // Update the row with the newly generated ID
    await newStaff.update({ staff_id: generatedId });

    return res.status(201).json({
      success: true,
      message: 'Staff registration successful!',
      staff_id: generatedId 
    });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Staff identity record already exists.' });
    }
    return res.status(500).json({ message: 'Staff registration server error', error: error.message });
  }
};

// ==========================================
// 2. READ ALL (Get All Staff)
// ==========================================
exports.getAllStaff = async (req, res) => {
    try {
        const staff = await StaffUser.findAll({
            attributes: { exclude: ['password'] }
        });
        return res.status(200).json({ success: true, data: staff });
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving staff', error: error.message });
    }
};

// ==========================================
// 3. READ ONE (Get Staff by Profile ID)
// ==========================================
exports.getStaffById = async (req, res) => {
    try {
        const { id } = req.params;

        // CRITICAL SECURITY CHECK: Compares database numeric ID
        if (req.user.role === 'staff' && String(req.user.id) !== String(id)) {
            return res.status(403).json({ message: 'Access denied. You can only access your own profile.' });
        }

        const staff = await StaffUser.findByPk(id, {
            attributes: { exclude: ['password'] }
        });

        if (!staff) {
            return res.status(404).json({ message: 'Staff not found.' });
        }

        return res.status(200).json({ success: true, data: staff });
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving staff profile', error: error.message });
    }
};

// ==========================================
// 4. UPDATE (Modify Staff Details)
// ==========================================
exports.updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        // FIX: Included all potential body fields to prevent ReferenceErrors
        const { name, age, id_number, occupation, gender, password, education_level, institution_name } = req.body;

        if (req.user.role === 'staff' && String(req.user.id) !== String(id)) {
            return res.status(403).json({ message: 'Access denied. You can only access your own profile.' });
        }
        
        const staff = await StaffUser.findByPk(id);
        if (!staff) {
            return res.status(404).json({ message: 'Staff not found.' });
        }

        // Build data payload dynamically based on updates provided
        const updatedData = {
            name: name || staff.name,
            gender: gender || staff.gender,
            age: age ? parseInt(age) : staff.age,
            id_number: id_number ? parseInt(id_number) : staff.id_number,
            occupation: occupation || staff.occupation,
            education_level: education_level || staff.education_level,
            institution_name: institution_name || staff.institution_name,
        };

        // If user is altering their password, re-hash it securely
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updatedData.password = await bcrypt.hash(password, salt);
        }

        await staff.update(updatedData);

        return res.status(200).json({ 
            success: true, 
            message: 'Staff profile updated successfully.' 
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating staff record', error: error.message });
    }
};

// ==========================================
// 5. DELETE (Remove Staff Account)
// ==========================================
exports.deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await StaffUser.findByPk(id);

        if (!staff) {
            return res.status(404).json({ message: 'Staff not found.' });
        }

        await staff.destroy();
        return res.status(200).json({ success: true, message: 'Staff record deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting staff profile', error: error.message });
    }
};

// ==========================================
// 6. STAFF LOGIN — STEP 1 (password check, issues UNVERIFIED token)
// ==========================================
exports.loginStaff = async (req, res) => {
  try {
    const { staff_id, password } = req.body;

    const user = await StaffUser.findOne({ where: { staff_id }, raw: true });
    if (!user) {
      return res.status(401).json({ message: 'Invalid Staff ID.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid Staff password.' });
    }

    // Trusted-device check — skip OTP if this browser already passed it before
    if (isDeviceTrusted(req, user.id)) {
      const fullToken = jwt.sign(
        {
          id: user.id,
          staff_id: user.staff_id,
          name: user.name,
          gender: user.gender,
          role: 'staff',
          is2FAVerified: true
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful (trusted device).',
        token: fullToken,
        role: 'staff',
        requires2FA: false
      });
    }

    // Not trusted — proceed with normal OTP flow
    const otp = generateOtp();
    otpStore.set(user.id, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
    console.log(`[DEV ONLY] OTP for staff_id ${user.staff_id}: ${otp}`);

    const tempToken = jwt.sign(
      {
        id: user.id,
        staff_id: user.staff_id,
        name: user.name,
        gender: user.gender,
        role: 'staff',
        is2FAVerified: false
      },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.status(200).json({
      success: true,
      message: '2FA required. Check your OTP delivery method.',
      token: tempToken,
      role: 'staff',
      requires2FA: true
    });

  } catch (error) {
    return res.status(500).json({ message: 'Staff login error', error: error.message });
  }
};

// ==========================================
// 7. STAFF LOGIN — STEP 2 (OTP check, issues FULLY VERIFIED token)
// ==========================================
exports.verifyStaff2FA = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;

    const record = otpStore.get(userId);
    if (!record) {
      return res.status(400).json({ message: 'No OTP request found. Please log in again.' });
    }
    if (Date.now() > record.expiresAt) {
      otpStore.delete(userId);
      return res.status(400).json({ message: 'OTP expired. Please log in again.' });
    }
    if (otp !== record.otp) {
      return res.status(400).json({ message: 'Incorrect OTP.' });
    }

    otpStore.delete(userId);

    // Mark this browser as trusted for future logins
    issueTrustedDeviceToken(userId, res);

    const fullToken = jwt.sign(
      {
        id: req.user.id,
        staff_id: req.user.staff_id,
        name: req.user.name,
        gender: req.user.gender,
        role: 'staff',
        is2FAVerified: true
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      success: true,
      message: '2FA verified. Device remembered for 30 days.',
      token: fullToken,
      role: 'staff'
    });

  } catch (error) {
    return res.status(500).json({ message: '2FA verification error', error: error.message });
  }
};
// ==========================================
// 8. REVOKE TRUSTED DEVICES
// ==========================================

// Revoke ALL trusted devices for the currently authenticated staff member
// (e.g. "log out all devices" after a suspected password compromise)
exports.revokeAllTrustedDevices = async (req, res) => {
  try {
    const staffId = req.user.id;
    let revokedCount = 0;

    for (const [token, record] of trustedDevices.entries()) {
      if (record.staffId === staffId) {
        trustedDevices.delete(token);
        revokedCount++;
      }
    }

    // Also clear the cookie on this current browser, since it's one of the ones just revoked
    res.clearCookie('trustedDevice', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
    return res.status(200).json({
      success: true,
      message: `Revoked ${revokedCount} trusted device(s). All devices will require verification code on next login.`
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error revoking trusted devices', error: error.message });
  }
};

// Revoke trust for ONLY the current browser (e.g. logging out of a shared/public computer)
exports.revokeCurrentDevice = async (req, res) => {
  try {
    const deviceToken = req.cookies?.trustedDevice;

    if (deviceToken) {
      trustedDevices.delete(deviceToken);
    }

    res.clearCookie('trustedDevice', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
    return res.status(200).json({
      success: true,
      message: 'This device will require verification code on next login.'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error revoking device trust', error: error.message });
  }
};