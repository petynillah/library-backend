const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const StaffUser = sequelize.define('staffs', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  staff_id: {
    type: DataTypes.STRING(255), 
    allowNull: true, // Keep this true! It allows step 3 to run before step 5 adds the ID.
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  name: { type: DataTypes.STRING(255), allowNull: false },
  gender: { type: DataTypes.STRING(50), allowNull: false },
  age: { type: DataTypes.INTEGER, allowNull: false },
  id_number: { type: DataTypes.INTEGER, allowNull: false },
  occupation: { type: DataTypes.STRING(255), allowNull: false },
  role: {
    type: DataTypes.ENUM('staff'),
    allowNull: false,
    defaultValue: 'staff'
  }
}, {
  timestamps: false, 
  indexes: [{ unique: true, fields: ['staff_id'], using: 'BTREE' }]
});

module.exports = StaffUser; 
