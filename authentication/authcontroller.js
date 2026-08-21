const StudentUser = require('./authmodel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("CRITICAL: JWT_SECRET is not defined in the environment variables.");
}
console.log('authmodel/controller sees:', JSON.stringify(process.env.JWT_SECRET));

console.log('Secret fingerprint:', crypto.createHash('sha256').update(process.env.JWT_SECRET).digest('hex').slice(0, 8));

// ==========================================
// 1. CREATE (Register Student)
// ==========================================
exports.registerStudent = async (req, res) => {
    try {
        const { name, gender, age, education_level, institution_name, password } = req.body;

        if (!name || !password || !gender || !age || !education_level || !institution_name) {
            return res.status(400).json({ message: 'All form fields are required.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newStudent = await StudentUser.create({
            name,
            gender,
            age: parseInt(age),
            education_level,
            institution_name,
            password: hashedPassword,
            role: 'student'
        });

        const currentYear = new Date().getFullYear();
        const generatedId = `STU-${currentYear}-${newStudent.id}`;

        await newStudent.update({ student_id: generatedId });

        return res.status(201).json({
            success: true,
            message: 'Registration successful!',
            student_id: generatedId
        });
    } catch (error) {
        return res.status(500).json({ message: 'Registration server error', error: error.message });
    }
};

// ==========================================
// 2. READ ALL (Get All Students, with optional search filter)
// ==========================================
exports.getAllStudents = async (req, res) => {
    try {
        const search = (req.query.search || '').trim();

        // Matches the frontend's "search by id or name" prompt — filters on either field
        const whereClause = search
            ? {
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
                    { student_id: { [Op.like]: `%${search}%` } }
                ]
            }
            : undefined;

        const students = await StudentUser.findAll({
            where: whereClause,
            attributes: { exclude: ['password'] }
        });
        return res.status(200).json({ success: true, data: students });
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving students', error: error.message });
    }
};

// ==========================================
// 3. READ ONE (Get Student by Profile ID)
// ==========================================
exports.getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        // CRITICAL SECURITY CHECK: Compares database numeric ID
        if (req.user.role === 'student' && String(req.user.id) !== String(id)) {
            return res.status(403).json({ message: 'Access denied. You can only access your own profile.' });
        }

        const student = await StudentUser.findByPk(id, {
            attributes: { exclude: ['password'] }
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        return res.status(200).json({ success: true, data: student });
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving student profile', error: error.message });
    }
};

// ==========================================
// 4. UPDATE (Modify Student Details)
// ==========================================
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, gender, age, education_level, institution_name, password } = req.body;

        if (req.user.role === 'student' && String(req.user.id) !== String(id)) {
            return res.status(403).json({ message: 'Access denied. You can only access your own profile.' });
        }
        
        const student = await StudentUser.findByPk(id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        const updatedData = {
            name: name || student.name,
            gender: gender || student.gender,
            age: age ? parseInt(age) : student.age,
            education_level: education_level || student.education_level,
            institution_name: institution_name || student.institution_name,
        };

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updatedData.password = await bcrypt.hash(password, salt);
        }

        await student.update(updatedData);

        return res.status(200).json({ 
            success: true, 
            message: 'Student profile updated successfully.' 
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating student record', error: error.message });
    }
};

// ==========================================
// 5. DELETE (Remove Student Account)
// ==========================================
exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await StudentUser.findByPk(id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        await student.destroy();
        return res.status(200).json({ success: true, message: 'Student record deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting student profile', error: error.message });
    }
};

// ==========================================
// 6. AUTHENTICATION: LOGIN
// ==========================================
exports.loginStudent = async (req, res) => {
    try {
        const { student_id, password } = req.body;
        const user = await StudentUser.findOne({ where: { student_id }, raw: true });

        if (!user) {
            return res.status(401).json({ message: 'Invalid Student ID.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Student password.' });
        }
        console.log('Secret fingerprint:', crypto.createHash('sha256').update(process.env.JWT_SECRET).digest('hex').slice(0, 8));


        const token = jwt.sign(
            { 
                id: user.id, 
                student_id: user.student_id,
                name: user.name,
                role: 'student', 
                is2FAVerified: false 
            },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        return res.status(200).json({ 
            success: true, 
            token: token, 
            role: 'student' 
        });
    } catch (error) {
        return res.status(500).json({ message: 'Student login error', error: error.message });
    }
};