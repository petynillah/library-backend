const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const User = sequelize.define('students', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  student_id: {
    type: DataTypes.STRING(255), 
    allowNull: true, // Set to true temporarily because we create the row, then inject the ID
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  name: { type: DataTypes.STRING(255), allowNull: false },
  gender: { type: DataTypes.STRING(50), allowNull: false },
  age: { type: DataTypes.INTEGER, allowNull: false },
  education_level: { type: DataTypes.STRING(100), allowNull: false },
  institution_name: { type: DataTypes.STRING(255), allowNull: false },
  role: {
    type: DataTypes.ENUM('student'),
    allowNull: false,
    defaultValue: 'student'
  }
}, {
  timestamps: false, 
  indexes: [{ unique: true, fields: ['student_id'], using: 'BTREE' }]
});

module.exports = User;
