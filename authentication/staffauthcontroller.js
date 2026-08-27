const StaffUser = require('./staffauthmodel');
const TrustedDevice = require('./trusteddevicemodel');
const SsoTicket = require('./ssoticketmodel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("CRITICAL: JWT_SECRET is not defined in the environment variables.");
}




// 1. GENERATE
exports.generateSSOTicket = async (req, res) => {
  const token = req.headers['authorization'];
  const ticket = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 1000);

  await SsoTicket.create({ ticket, token, expires_at: expiresAt });

  // opportunistic cleanup — cheap, keeps the table from growing unbounded
  SsoTicket.destroy({ where: { expires_at: { [Op.lt]: new Date() } } }).catch(() => {});

  return res.status(200).json({ success: true, ticket });
};

// 2. EXCHANGE
exports.exchangeSSOTicket = async (req, res) => {
  const { ticket } = req.body;

  const record = await SsoTicket.findOne({ where: { ticket } });
  if (!record) {
    return res.status(400).json({ success: false, message: 'Invalid or spent security ticket.' });
  }

  // Delete-by-id is the atomic "consume" step: if two requests race,
  // only one destroy() call will report 1 row deleted — the other gets 0.
  const deletedCount = await SsoTicket.destroy({ where: { id: record.id } });
  if (deletedCount === 0) {
    return res.status(400).json({ success: false, message: 'Invalid or spent security ticket.' });
  }

  if (Date.now() > new Date(record.expires_at).getTime()) {
    return res.status(400).json({ success: false, message: 'Security ticket has expired.' });
  }

  return res.status(200).json({ success: true, token: record.token });
};


// ==========================================
// PERSISTENT TRUSTED-DEVICE DATABASE HELPERS
// ==========================================

async function issueTrustedDeviceToken(staffId, res) {
  const deviceToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await TrustedDevice.create({
    device_token: deviceToken,
    staff_id: staffId,
    expires_at: expiresAt
  });

  res.cookie('trustedDevice', deviceToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

async function isDeviceTrusted(req, staffId) {
  const deviceToken = req.cookies?.trustedDevice;
  if (!deviceToken) return false;

  const record = await TrustedDevice.findOne({ where: { device_token: deviceToken } });
  if (!record) return false;

  if (new Date() > record.expires_at) {
    await record.destroy(); 
    return false;
  }

  // FIX: Cast both sides to String to prevent type-mismatch bugs (e.g., "1" === 1 is false)
  return String(record.staff_id) === String(staffId);
}

// ==========================================
// TEMPORARY OTP STORE (in-memory)
// ==========================================
const otpStore = new Map(); 

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString(); 
}

// ==========================================
// 1. CREATE (Staff Registration)
// ==========================================
exports.registerStaff = async (req, res) => {
  try {
    const { name, age, id_number, occupation, gender, password } = req.body;

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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStaff = await StaffUser.create({
      name,
      gender,
      age: parseInt(age),
      id_number: parseInt(id_number),
      occupation,
      password: hashedPassword,
      role: 'staff'
    });

    const currentYear = new Date().getFullYear();
    const generatedId = `STF-${currentYear}-${newStaff.id}`;

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
        const { name, age, id_number, occupation, gender, password, education_level, institution_name } = req.body;

        if (req.user.role === 'staff' && String(req.user.id) !== String(id)) {
            return res.status(403).json({ message: 'Access denied. You can only access your own profile.' });
        }
        
        const staff = await StaffUser.findByPk(id);
        if (!staff) {
            return res.status(404).json({ message: 'Staff not found.' });
        }

        const updatedData = {
            name: name || staff.name,
            gender: gender || staff.gender,
            age: age ? parseInt(age) : staff.age,
            id_number: id_number ? parseInt(id_number) : staff.id_number,
            occupation: occupation || staff.occupation,
            education_level: education_level || staff.education_level,
            institution_name: institution_name || staff.institution_name,
        };

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
// UPDATED STAFF LOGIN — STEP 1
// ==========================================
exports.loginStaff = async (req, res) => {
  try {
    const { staff_id, password } = req.body;

    const user = await StaffUser.findOne({ where: { staff_id } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Await the new database check 
    const trusted = await isDeviceTrusted(req, user.id);
    if (trusted) {
      const token = jwt.sign(
        { id: user.id, name: user.name, staff_id: user.staff_id, gender: user.gender, role: user.role, is2FAVerified: true },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful (Trusted Device Bypass).',
        token: `Bearer ${token}`,
        requires2FA: false
      });
    }

    // Fallback if untrusted: Setup verification state
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(user.id, { otp, expiresAt }); // Keep OTP in memory or move to Redis later

    console.log(`[DEV ONLY] OTP Code for ${user.name}: ${otp}`);

    const tempToken = jwt.sign(
      { id: user.id, role: user.role, is2FAVerified: false },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.status(200).json({
      success: true,
      message: 'Verification code sent.',
      token: `Bearer ${tempToken}`,
      requires2FA: true
    });

  } catch (error) {
    return res.status(500).json({ message: 'Login server error', error: error.message });
  }
};

// ==========================================
// UPDATED STAFF LOGIN — STEP 2
// ==========================================
exports.verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const staffId = req.user.id; 

    const record = otpStore.get(staffId);
    if (!record) return res.status(400).json({ success: false, message: 'No OTP requested or expired.' });
    if (Date.now() > record.expiresAt) {
      otpStore.delete(staffId);
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }
    if (record.otp !== String(otp)) return res.status(400).json({ success: false, message: 'Invalid verification code.' });

    otpStore.delete(staffId);
    const user = await StaffUser.findByPk(staffId);
    
    // Await the persistent cookie generation
    await issueTrustedDeviceToken(user.id, res);

    const token = jwt.sign(
      { id: user.id, name: user.name, staff_id: user.staff_id, gender: user.gender, role: user.role, is2FAVerified: true },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({ success: true, message: 'MFA verified successfully.', token: `Bearer ${token}` });
  } catch (error) {
    return res.status(500).json({ message: 'Verification error', error: error.message });
  }
};

// ==========================================
// UPDATED REVOCATION ENDPOINTS
// ==========================================
exports.revokeCurrentDevice = async (req, res) => {
  try {
    const deviceToken = req.cookies?.trustedDevice;
    if (deviceToken) {
      // Delete the specific token row out of MySQL
      await TrustedDevice.destroy({ where: { device_token: deviceToken } });
    }
    res.clearCookie('trustedDevice');
    return res.status(200).json({ success: true, message: 'This device has been forgotten.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error forgetting device', error: error.message });
  }
};

exports.revokeAllTrustedDevices = async (req, res) => {
  try {
    const staffId = req.user.id;
    // Delete all tokens assigned to this user out of MySQL
    await TrustedDevice.destroy({ where: { staff_id: staffId } });
    res.clearCookie('trustedDevice');
    return res.status(200).json({ success: true, message: 'All devices revoked successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error revoking all devices', error: error.message });
  }
};

